/*
Fri Oct 10 2014 15:50:09 GMT+0800 (CST)
combined files by KMD:

index.js
lib/ddm.js
lib/draggable.js
lib/draggable-delegate.js
lib/droppable-delegate.js
lib/droppable.js
lib/plugin/constrain.js
lib/plugin/proxy.js
lib/plugin/scroll.js
*/

KISSY.add('kg/dd/2.0.0/index',["./lib/ddm","./lib/draggable","./lib/draggable-delegate","./lib/droppable-delegate","./lib/droppable","./lib/plugin/constrain","./lib/plugin/proxy","./lib/plugin/scroll"],function(S ,require, exports, module) {
/**
 * @ignore
 * dd support for kissy
 * @author yiminghe@gmail.com
 */
var DDM = require('./lib/ddm'),
    Draggable = require('./lib/draggable'),
    DraggableDelegate = require('./lib/draggable-delegate'),
    DroppableDelegate = require('./lib/droppable-delegate'),
    Droppable = require('./lib/droppable'),
    Constrain = require('./lib/plugin/constrain'),
    Proxy = require('./lib/plugin/proxy'),
    Scroll = require('./lib/plugin/scroll');
var DD = {
    Draggable: Draggable,
    DDM: DDM,
    Droppable: Droppable,
    DroppableDelegate: DroppableDelegate,
    DraggableDelegate: DraggableDelegate,
    Constrain: Constrain,
    Proxy: Proxy,
    Scroll: Scroll
};

KISSY.DD = DD;

module.exports = DD;
});
KISSY.add('kg/dd/2.0.0/lib/ddm',["node","base"],function(S ,require, exports, module) {
/**
 * @ignore
 * dd support for kissy, dd objects central management module
 * @author yiminghe@gmail.com
 */
var Node = require('node'),
    Base = require('base');
var logger = S.getLogger('./ddm');
var UA = S.UA,
    $ = Node.all,

    win = S.Env.host,
    doc = win.document,
    $doc = $(doc),
    $win = $(win),
    ie6 = UA.ie === 6,
// prevent collision with click , only start when move
    PIXEL_THRESH = 3,
// or start when mousedown for 1 second
    BUFFER_TIME = 1,
    MOVE_DELAY = 30,
    SHIM_Z_INDEX = 999999;

var Gesture = Node.Gesture,
    DRAG_MOVE_EVENT = Gesture.move,
    DRAG_END_EVENT = Gesture.end;
/*
 负责拖动涉及的全局事件：
 1.全局统一的鼠标移动监控
 2.全局统一的鼠标弹起监控，用来通知当前拖动对象停止
 3.为了跨越 iframe 而统一在底下的遮罩层
 */


/**
 * @class KISSY.DD.DDM
 * @singleton
 * @private
 * @extends KISSY.Base
 * Manager for Drag and Drop.
 */
var DDM = Base.extend({
    /*
     可能要进行拖放的对象，需要通过 buffer/pixelThresh 考验
     */
    __activeToDrag: 0,

    /**
     * @ignore
     */
    _regDrop: function (d) {
        this.get('drops').push(d);
    },

    /**
     * @ignore
     */
    _unRegDrop: function (d) {
        var self = this,
            drops = self.get('drops'),
            index = S.indexOf(d, drops);
        if (index !== -1) {
            drops.splice(index, 1);
        }
    },

    /**
     * 注册可能将要拖放的节点
     * @param drag
     * @ignore
     */
    _regToDrag: function (drag) {
        var self = this;
        // 事件先要注册好，防止点击，导致 mouseup 时还没注册事件
        self.__activeToDrag = drag;
        registerEvent(self);
    },

    /**
     * 真正开始 drag
     * 当前拖动对象通知全局：我要开始啦
     * 全局设置当前拖动对象
     * @ignore
     */
    _start: function () {
        var self = this,
            drag = self.__activeToDrag;
        if (!drag) {
            return;
        }
        self.setInternal('activeDrag', drag);
        // 预备役清掉
        self.__activeToDrag = 0;
        // 真正开始移动了才激活垫片
        if (drag.get('shim')) {
            activeShim(self);
        }
        // avoid unnecessary drop check
        self.__needDropCheck = 0;
        if (drag.get('groups')) {
            _activeDrops(self);
            if (self.get('validDrops').length) {
                cacheWH(drag.get('node'));
                self.__needDropCheck = 1;
            }
        }
    },

    /**
     * @ignore
     */
    _addValidDrop: function (drop) {
        this.get('validDrops').push(drop);
    },

    /**
     * 全局通知当前拖动对象：结束拖动了！
     * @ignore
     */
    _end: function (e) {
        var self = this,
            __activeToDrag = self.__activeToDrag,
            activeDrag = self.get('activeDrag'),
            activeDrop = self.get('activeDrop');

        if (e) {
            if (__activeToDrag) {
                __activeToDrag._move(e);
            }
            if (activeDrag) {
                activeDrag._move(e);
            }
        }

        unRegisterEvent(self);
        // 预备役清掉 , click 情况下 mousedown->mouseup 极快过渡
        if (__activeToDrag) {
            __activeToDrag._end(e);
            self.__activeToDrag = 0;
        }
        if (self._shim) {
            self._shim.hide();
        }
        if (!activeDrag) {
            return;
        }
        activeDrag._end(e);
        _deActiveDrops(self);
        if (activeDrop) {
            activeDrop._end(e);
        }
        self.setInternal('activeDrag', null);
        self.setInternal('activeDrop', null);
    }
}, {
    ATTRS: {

        /**
         * cursor style when dragging,if shimmed the shim will get the cursor.
         * Defaults to: 'move'.
         * @property dragCursor
         * @type {String}
         */

        /**
         * @ignore
         */
        dragCursor: {
            value: 'move'
        },

        /***
         * the number of pixels to move to start a drag operation,default is 3.
         * Defaults to: 3.
         * @property clickPixelThresh
         * @type {Number}
         */

        /**
         * @ignore
         */
        clickPixelThresh: {
            value: PIXEL_THRESH
        },

        /**
         * the number of milliseconds to start a drag operation after mousedown,unit second.
         * Defaults to: 1.
         * @property bufferTime
         * @type {Number}
         */

        /**
         * @ignore
         */
        bufferTime: {
            value: BUFFER_TIME
        },

        /**
         * currently active draggable object
         * @type {KISSY.DD.Draggable}
         * @readonly
         * @property activeDrag
         */
        /**
         * @ignore
         */
        activeDrag: {},

        /**
         * currently active droppable object
         * @type {KISSY.DD.Droppable}
         * @readonly
         * @property activeDrop
         */
        /**
         * @ignore
         */
        activeDrop: {},

        /**
         * an array of drop targets.
         * @property drops
         * @type {KISSY.DD.Droppable[]}
         * @private
         */
        /**
         * @ignore
         */
        drops: {
            value: []
        },

        /**
         * a array of the valid drop targets for this interaction
         * @property validDrops
         * @type {KISSY.DD.Droppable[]}
         * @private
         */
        /**
         * @ignore
         */
        validDrops: {
            value: []
        }
    }
});

/*
 全局鼠标移动事件通知当前拖动对象正在移动
 注意：chrome8: click 时 mousedown-mousemove-mouseup-click 也会触发 mousemove
 */
function move(ev) {
    var self = this,
        drag,
        __activeToDrag ,
        activeDrag;

    if (ev.touches && ev.touches.length > 1) {
        ddm._end();
        return;
    }

    // 先处理预备役，效率!
    if ((__activeToDrag = self.__activeToDrag)) {
        __activeToDrag._move(ev);
    } else if ((activeDrag = self.get('activeDrag'))) {
        activeDrag._move(ev);
        // for drop-free draggable performance
        if (self.__needDropCheck) {
            notifyDropsMove(self, ev, activeDrag);
        }
    }

    drag = __activeToDrag || activeDrag;
    // 防止 ie 选择到字
    // touch need direction
    if (drag && drag.get('preventDefaultOnMove')) {
        ev.preventDefault();
    }
}

// 同一时刻只可能有个 drag 元素，只能有一次 move 被注册，不需要每个实例一个 throttle
// 一个应用一个 document 只需要注册一个 move
// 2013-01-24 更灵敏 for scroller in webkit
var throttleMove = UA.ie ? S.throttle(move, MOVE_DELAY) : move;

function notifyDropsMove(self, ev, activeDrag) {
    var drops = self.get('validDrops'),
        mode = activeDrag.get('mode'),
        activeDrop = 0,
        oldDrop,
        vArea = 0,
        dragRegion = region(activeDrag.get('node')),
        dragArea = area(dragRegion);

    S.each(drops, function (drop) {
        if (drop.get('disabled')) {
            return undefined;
        }

        var a,
            node = drop.getNodeFromTarget(ev,
                // node
                activeDrag.get('dragNode')[0],
                // proxy node
                activeDrag.get('node')[0]);

        if (!node
        // 当前 drop 区域已经包含  activeDrag.get('node')
        // 不要返回，可能想调整位置
            ) {
            return undefined;
        }

        if (mode === 'point') {
            //取鼠标所在的 drop 区域
            if (inNodeByPointer(node, activeDrag.mousePos)) {
                a = area(region(node));
                if (!activeDrop) {
                    activeDrop = drop;
                    vArea = a;
                } else {
                    // 当前得到的可放置元素范围更小，取范围小的那个
                    if (a < vArea) {
                        activeDrop = drop;
                        vArea = a;
                    }
                }
            }
        } else if (mode === 'intersect') {
            //取一个和activeDrag交集最大的drop区域
            a = area(intersect(dragRegion, region(node)));
            if (a > vArea) {
                vArea = a;
                activeDrop = drop;
            }

        } else if (mode === 'strict') {
            //drag 全部在 drop 里面
            a = area(intersect(dragRegion, region(node)));
            if (a === dragArea) {
                activeDrop = drop;
                return false;
            }
        }
        return undefined;
    });

    oldDrop = self.get('activeDrop');
    if (oldDrop && oldDrop !== activeDrop) {
        oldDrop._handleOut(ev);
        activeDrag._handleOut(ev);
    }
    self.setInternal('activeDrop', activeDrop);
    if (activeDrop) {
        if (oldDrop !== activeDrop) {
            activeDrop._handleEnter(ev);
        } else {
            // 注意处理代理时内部节点变化导致的 out、enter
            activeDrop._handleOver(ev);
        }
    }
}

/*
 垫片只需创建一次
 */
var activeShim = function (self) {
    //创造垫片，防止进入iframe，外面document监听不到 mousedown/up/move
    self._shim = $('<div ' +
        'style="' +
        //red for debug
        'background-color:red;' +
        'position:' + (ie6 ? 'absolute' : 'fixed') + ';' +
        'left:0;' +
        'width:100%;' +
        'height:100%;' +
        'top:0;' +
        'cursor:' + ddm.get('dragCursor') + ';' +
        'z-index:' +
        //覆盖iframe上面即可
        SHIM_Z_INDEX + ';' +
        '"><' + '/div>')
        .prependTo(doc.body || doc.documentElement)
        //0.5 for debug
        .css('opacity', 0);

    activeShim = showShim;

    if (ie6) {
        // ie6 不支持 fixed 以及 width/height 100%
        // support dd-scroll
        // prevent empty when scroll outside initial window
        $win.on('resize scroll', adjustShimSize, self);
    }

    showShim(self);
};

var adjustShimSize = S.throttle(function () {
    var self = this,
        activeDrag;
    if ((activeDrag = self.get('activeDrag')) &&
        activeDrag.get('shim')) {
        self._shim.css({
            width: $doc.width(),
            height: $doc.height()
        });
    }
}, MOVE_DELAY);

function showShim(self) {
    // determine cursor according to activeHandler and dragCursor
    var ah = self.get('activeDrag').get('activeHandler'),
        cur = 'auto';
    if (ah) {
        cur = ah.css('cursor');
    }
    if (cur === 'auto') {
        cur = self.get('dragCursor');
    }
    self._shim.css({
        cursor: cur,
        display: 'block'
    });
    if (ie6) {
        adjustShimSize.call(self);
    }
}

/*
 开始时注册全局监听事件
 */
function registerEvent(self) {
    $doc.on(DRAG_END_EVENT, self._end, self);
    $doc.on(DRAG_MOVE_EVENT, throttleMove, self);
    // http://stackoverflow.com/questions/1685326/responding-to-the-onmousemove-event-outside-of-the-browser-window-in-ie
    // ie6 will not response to event when cursor is out of window.
    if (doc.body.setCapture) {
        doc.body.setCapture();
    }
}

/*
 结束时需要取消掉，防止平时无谓的监听
 */
function unRegisterEvent(self) {
    $doc.detach(DRAG_MOVE_EVENT, throttleMove, self);
    $doc.detach(DRAG_END_EVENT, self._end, self);
    if (doc.body.releaseCapture) {
        doc.body.releaseCapture();
    }
}

function _activeDrops(self) {
    var drops = self.get('drops');
    self.setInternal('validDrops', []);
    if (drops.length) {
        S.each(drops, function (d) {
            d._active();
        });
    }
}

function _deActiveDrops(self) {
    var drops = self.get('drops');
    self.setInternal('validDrops', []);
    if (drops.length) {
        S.each(drops, function (d) {
            d._deActive();
        });
    }
}


function region(node) {
    var offset = node.offset();
    if (!node.__ddCachedWidth) {
        logger.debug('no cache in dd!');
        logger.debug(node[0]);
    }
    return {
        left: offset.left,
        right: offset.left + (node.__ddCachedWidth || node.outerWidth()),
        top: offset.top,
        bottom: offset.top + (node.__ddCachedHeight || node.outerHeight())
    };
}

function inRegion(region, pointer) {
    return region.left <= pointer.left &&
        region.right >= pointer.left &&
        region.top <= pointer.top &&
        region.bottom >= pointer.top;
}

function area(region) {
    if (region.top >= region.bottom || region.left >= region.right) {
        return 0;
    }
    return (region.right - region.left) * (region.bottom - region.top);
}

function intersect(r1, r2) {
    var t = Math.max(r1.top, r2.top),
        r = Math.min(r1.right, r2.right),
        b = Math.min(r1.bottom, r2.bottom),
        l = Math.max(r1.left, r2.left);
    return {
        left: l,
        right: r,
        top: t,
        bottom: b
    };
}

function inNodeByPointer(node, point) {
    return inRegion(region(node), point);
}

function cacheWH(node) {
    if (node) {
        node.__ddCachedWidth = node.outerWidth();
        node.__ddCachedHeight = node.outerHeight();
    }
}

var ddm = new DDM();
ddm.inRegion = inRegion;
ddm.region = region;
ddm.area = area;
ddm.cacheWH = cacheWH;
ddm.PREFIX_CLS = 'ks-dd-';

module.exports = ddm;

});
KISSY.add('kg/dd/2.0.0/lib/draggable',["node","./ddm","base"],function(S ,require, exports, module) {
var Node = require('node'),
    DDM = require('./ddm'),
    Base = require('base');
var UA = S.UA,
    $ = Node.all,
    each = S.each,
    Features = S.Features,
    ie = UA.ie,
    NULL = null,
    PREFIX_CLS = DDM.PREFIX_CLS,
    doc = document;

/**
 * @class KISSY.DD.Draggable
 * @extends KISSY.Base
 * Provide abilities to make specified node draggable
 */
var Draggable = Base.extend({
    initializer: function () {
        var self = this;
        self.addTarget(DDM);
        /**
         * fired when need to compute draggable 's position during dragging
         * @event dragalign
         * @member KISSY.DD.DDM
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         */

        /**
         * fired when need to get draggable 's position during dragging
         * @event dragalign
         * @member KISSY.DD.Draggable
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         */


        /**
         * fired during dragging
         * @event drag
         * @member KISSY.DD.DDM
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         * @param e.left node 's supposed position left
         * @param e.top node 's supposed position top
         * @param e.pageX mouse position left
         * @param e.pageY mouse position top
         */

        /**
         * fired during dragging
         * @event drag
         * @member KISSY.DD.Draggable
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         * @param e.left node 's supposed position left
         * @param e.top node 's supposed position top
         * @param e.pageX mouse position left
         * @param e.pageY mouse position top
         */


        /**
         * fired after drop a draggable onto a droppable object
         * @event dragdrophit
         * @member KISSY.DD.DDM
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */

        /**
         * fired after drop a draggable onto a droppable object
         * @event dragdrophit
         * @member KISSY.DD.Draggable
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */


        /**
         * fired after drag
         * @event dragend
         * @member KISSY.DD.DDM
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         */

        /**
         * fired after drag
         * @event dragend
         * @member KISSY.DD.Draggable
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         */


        /**
         * fired after drop a draggable onto nothing
         * @event dragdropmiss
         * @member KISSY.DD.DDM
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         */

        /**
         * fired after drop a draggable onto nothing
         * @event dragdropmiss
         * @member KISSY.DD.Draggable
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         */


        /**
         * fired after a draggable leaves a droppable
         * @event dragexit
         * @member KISSY.DD.DDM
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */

        /**
         * fired after a draggable leaves a droppable
         * @event dragexit
         * @member KISSY.DD.Draggable
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */


        /**
         * fired after a draggable object mouseenter a droppable object
         * @event dragenter
         * @member KISSY.DD.DDM
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */

        /**
         * fired after a draggable object mouseenter a droppable object
         * @event dragenter
         * @member KISSY.DD.Draggable
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */


        /**
         * fired after a draggable object mouseover a droppable object
         * @event dragover
         * @member KISSY.DD.DDM
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */

        /**
         * fired after a draggable object mouseover a droppable object
         * @event dragover
         * @member KISSY.DD.Draggable
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */


        /**
         * fired after a draggable object start to drag
         * @event dragstart
         * @member KISSY.DD.DDM
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         */

        /**
         * fired after a draggable object start to drag
         * @event dragstart
         * @member KISSY.DD.Draggable
         * @param {KISSY.Event.CustomEvent.Object} e
         * @param e.drag current draggable object
         */

        self._allowMove = self.get('move');
    },

    '_onSetNode': function (n) {
        var self = this;
        // dragNode is equal to node in single mode
        self.setInternal('dragNode', n);
        self.bindDragEvent();
    },

    bindDragEvent: function () {
        var self = this,
            node = self.get('node');
        node.on(Node.Gesture.start, handlePreDragStart, self)
            .on('dragstart', self._fixDragStart);
    },

    detachDragEvent: function (self) {
        self = this;
        var node = self.get('node');
        node.detach(Node.Gesture.start, handlePreDragStart, self)
            .detach('dragstart', self._fixDragStart);
    },

    /**
     * mousedown 1秒后自动开始拖的定时器
     * @ignore
     */
    _bufferTimer: NULL,

    _onSetDisabledChange: function (d) {
        this.get('dragNode')[d ? 'addClass' : 'removeClass'](PREFIX_CLS + '-disabled');
    },

    _fixDragStart: fixDragStart,

    _checkHandler: function (t) {
        var self = this,
            handlers = self.get('handlers'),
            ret = 0;
        each(handlers, function (handler) {
            //子区域内点击也可以启动
            if (handler[0] === t || handler.contains(t)) {
                ret = 1;
                self.setInternal('activeHandler', handler);
                return false;
            }
            return undefined;
        });
        return ret;
    },

    _checkDragStartValid: function (ev) {
        var self = this;
        if (self.get('primaryButtonOnly') && ev.which !== 1 ||
            self.get('disabled')) {
            return 0;
        }
        return 1;
    },

    _prepare: function (ev) {
        if (!ev) {
            return;
        }

        var self = this;

        if (ie) {
            fixIEMouseDown();
        }

        // http://blogs.msdn.com/b/ie/archive/2011/10/19/handling-multi-touch-and-mouse-input-in-all-browsers.aspx
        // stop panning and zooming so we can draw for win8?
//            if (ev.originalEvent['preventManipulation']) {
//                ev.originalEvent.preventManipulation();
//            }

        // 防止 firefox/chrome 选中 text
        // 非 ie，阻止了 html dd 的默认行为
        if (self.get('halt')) {
            ev.stopPropagation();
        }

        // in touch device
        // prevent touchdown will prevent native scroll
        // need to prevent on move conditionally
        // will prevent text selection and link click
        if (!Features.isTouchEventSupported()) {
            ev.preventDefault();
        }

        var mx = ev.pageX,
            my = ev.pageY;

        self.setInternal('startMousePos', self.mousePos = {
            left: mx,
            top: my
        });

        if (self._allowMove) {
            var node = self.get('node'),
                nxy = node.offset();
            self.setInternal('startNodePos', nxy);
            self.setInternal('deltaPos', {
                left: mx - nxy.left,
                top: my - nxy.top
            });
        }

        DDM._regToDrag(self);

        var bufferTime = self.get('bufferTime');

        // 是否中央管理，强制限制拖放延迟
        if (bufferTime) {
            self._bufferTimer = setTimeout(function () {
                // 事件到了，仍然是 mousedown 触发！
                self._start(ev);
            }, bufferTime * 1000);
        }
    },

    _clearBufferTimer: function () {
        var self = this;
        if (self._bufferTimer) {
            clearTimeout(self._bufferTimer);
            self._bufferTimer = 0;
        }
    },

    _move: function (ev) {
        var self = this,
            pageX = ev.pageX,
            pageY = ev.pageY;

        if (!self.get('dragging')) {
            var startMousePos = self.get('startMousePos'),
                start = 0,
                clickPixelThresh = self.get('clickPixelThresh');
            // 鼠标经过了一定距离，立即开始
            if (Math.abs(pageX - startMousePos.left) >= clickPixelThresh ||
                Math.abs(pageY - startMousePos.top) >= clickPixelThresh) {
                self._start(ev);
                start = 1;
            }
            // 2013-02-12 更快速响应 touch，本轮就触发 drag 事件
            if (!start) {
                return;
            }
        }

        self.mousePos = {
            left: pageX,
            top: pageY
        };

        var customEvent = {
            drag: self,
            left: pageX,
            top: pageY,
            pageX: pageX,
            pageY: pageY,
            domEvent: ev
        };

        var move = self._allowMove;

        if (move) {
            var diff = self.get('deltaPos'),
                left = pageX - diff.left,
                top = pageY - diff.top;
            customEvent.left = left;
            customEvent.top = top;
            self.setInternal('actualPos', {
                left: left,
                top: top
            });
            self.fire('dragalign', customEvent);
        }

        var def = 1;

        // allow call preventDefault on handlers
        if (self.fire('drag', customEvent) === false) {
            def = 0;
        }

        if (def && move) {
            // 取 'node' , 改 node 可能是代理哦
            self.get('node').offset(self.get('actualPos'));
        }
    },

    /**
     * force to stop this drag operation
     * @member KISSY.DD.Draggable
     */
    'stopDrag': function () {
        DDM._end();
    },

    _end: function (e) {
        e = e || {};

        var self = this,
            activeDrop;

        // 否则清除定时器即可
        self._clearBufferTimer();
        if (ie) {
            fixIEMouseUp();
        }
        // 如果已经开始，收尾工作
        if (self.get('dragging')) {
            self.get('node')
                .removeClass(PREFIX_CLS + 'drag-over');
            if ((activeDrop = DDM.get('activeDrop'))) {
                self.fire('dragdrophit', {
                    drag: self,
                    drop: activeDrop
                });
            } else {
                self.fire('dragdropmiss', {
                    drag: self
                });
            }
            self.setInternal('dragging', 0);
            self.fire('dragend', {
                drag: self,
                pageX: e.pageX,
                pageY: e.pageY
            });
        }
    },

    _handleOut: function () {
        var self = this;
        self.get('node').removeClass(PREFIX_CLS + 'drag-over');

        // html5 => dragleave
        self.fire('dragexit', {
            drag: self,
            drop: DDM.get('activeDrop')
        });
    },

    _handleEnter: function (e) {
        var self = this;
        self.get('node').addClass(PREFIX_CLS + 'drag-over');
        //第一次先触发 dropenter, dragenter
        self.fire('dragenter', e);
    },

    _handleOver: function (e) {
        this.fire('dragover', e);
    },

    _start: function (ev) {
        var self = this;
        self._clearBufferTimer();
        self.setInternal('dragging', 1);
        self.setInternal('dragStartMousePos', {
            left: ev.pageX,
            top: ev.pageY
        });
        DDM._start();
        self.fire('dragstart', {
            drag: self,
            pageX: ev.pageX,
            pageY: ev.pageY
        });
    },

    /**
     * make the drag node undraggable
     * @member KISSY.DD.Draggable
     * @private
     */
    destructor: function () {
        var self = this;
        self.detachDragEvent();
        self.detach();
    }
}, {
    name: 'Draggable',

    ATTRS: {
        /**
         * the dragged node. maybe a proxy node.
         * @property node
         * @type {HTMLElement|KISSY.NodeList}
         * @readonly
         */

        /**
         * the dragged node.
         * @cfg {HTMLElement|KISSY.NodeList} node
         */

        /**
         * @ignore
         */
        node: {
            setter: function (v) {
                if (!(v instanceof Node)) {
                    return $(v);
                }
                return undefined;
            }
        },

        /**
         * the number of pixels to move to start a drag operation
         *
         * Defaults to: {@link KISSY.DD.DDM#clickPixelThresh}.
         *
         * @cfg {Number} clickPixelThresh
         */
        /**
         * @ignore
         */
        clickPixelThresh: {
            valueFn: function () {
                return DDM.get('clickPixelThresh');
            }
        },

        /**
         * the number of milliseconds to start a drag operation after mousedown.
         *
         * Defaults to: {@link KISSY.DD.DDM#bufferTime}.
         *
         * @cfg {Number} bufferTime
         */
        /**
         * @ignore
         */
        bufferTime: {
            valueFn: function () {
                return DDM.get('bufferTime');
            }
        },

        /**
         * the draggable element.
         * @property dragNode
         * @type {HTMLElement}
         * @readonly
         */
        /**
         * @ignore
         */
        dragNode: {},

        /**
         * use protective shim to cross iframe.
         *
         * Defaults to: false
         *
         * @cfg {Boolean} shim
         *
         */
        /**
         * @ignore
         */
        shim: {
            value: false
        },

        /**
         * valid handlers to initiate a drag operation.
         *
         * Default same with {@link KISSY.DD.Draggable#cfg-node} config.
         *
         * @cfg {HTMLElement[]|Function[]|String[]} handlers
         */
        /**
         * @ignore
         */
        handlers: {
            value: [],
            getter: function (vs) {
                var self = this;
                if (!vs.length) {
                    vs[0] = self.get('node');
                }
                each(vs, function (v, i) {
                    if (typeof v === 'function') {
                        v = v.call(self);
                    }
                    // search inside node
                    if (typeof v === 'string') {
                        v = self.get('node').one(v);
                    }
                    if (v.nodeType) {
                        v = $(v);
                    }
                    vs[i] = v;
                });
                self.setInternal('handlers', vs);
                return vs;
            }
        },

        /**
         * the handler which fired the drag event.
         * @type {KISSY.NodeList}
         * @property activeHandler
         * @readonly
         */
        /**
         * @ignore
         */
        activeHandler: {},

        /**
         * indicate whether this draggable object is being dragged
         * @type {Boolean}
         * @property dragging
         * @readonly
         */
        /**
         * @ignore
         */
        dragging: {
            value: false,
            setter: function (d) {
                var self = this;
                self.get('dragNode')[d ? 'addClass' : 'removeClass']
                    (PREFIX_CLS + 'dragging');
            }
        },

        /**
         * drop mode.
         * @cfg {KISSY.DD.Draggable.DropMode} mode
         */
        /**
         * @ignore
         */
        mode: {
            value: 'point'
        },

        /**
         * set to disable this draggable so that it can not be dragged.
         *
         * Defaults to: false
         *
         * @type {Boolean}
         * @property disabled
         */
        /**
         * @ignore
         */
        disabled: {
            value: false
        },

        /**
         * whether the drag node moves with cursor, can be used to resize element.
         *
         * Defaults to: false
         *
         * @cfg {Boolean} move
         */
        /**
         * @ignore
         */
        move: {
            value: true
        },

        /**
         * whether a drag operation can only be trigged by primary(left) mouse button.
         * Setting false will allow for all mousedown events to trigger drag.
         * @cfg {Boolean} primaryButtonOnly
         */
        /**
         * @ignore
         */
        primaryButtonOnly: {
            value: true
        },

        /**
         * whether halt mousedown event.
         *
         * Defaults to: true
         *
         * @cfg {Boolean} halt
         */
        /**
         * @ignore
         */
        halt: {
            value: true
        },

        /**
         * groups this draggable object belongs to, can interact with droppable.
         * if this draggable does not want to interact with droppable for performance,
         * can set this to false.
         * for example:
         *      @example
         *      {
         *          'group1':1,
         *          'group2':1
         *      }
         *
         * @cfg {Object} groups
         */
        /**
         * @ignore
         */
        groups: {
            value: true
        },

        /**
         * mouse position at mousedown
         * for example:
         *      @example
         *      {
         *          left: 100,
         *          top: 200
         *      }
         *
         * @property startMousePos
         * @type {Object}
         * @readonly
         */
        /**
         * @ignore
         */
        startMousePos: {

        },


        /**
         * mouse position at drag start
         * for example:
         *      @example
         *      {
         *          left: 100,
         *          top: 200
         *      }
         *
         * @property dragStartMousePos
         * @type {Object}
         * @readonly
         */
        /**
         * @ignore
         */
        dragStartMousePos: {

        },

        /**
         * node position ar drag start.
         * only valid when move is set to true.
         *
         * for example:
         *      @example
         *      {
         *          left: 100,
         *          top: 200
         *      }
         *
         * @property startNodePos
         * @type {Object}
         * @readonly
         */
        /**
         * @ignore
         */
        startNodePos: {

        },

        /**
         * The offset of the mouse position to the element's position.
         * only valid when move is set to true.
         * @property deltaPos
         * @type {Object}
         * @readonly
         */
        /**
         * @ignore
         */
        deltaPos: {

        },

        /**
         * The xy that the node will be set to.
         * Changing this will alter the position as it's dragged.
         * only valid when move is set to true.
         * @property actualPos
         * @type {Object}
         * @readonly
         */
        /**
         * @ignore
         */
        actualPos: {

        },


        preventDefaultOnMove: {
            value: true
        }
    },

    inheritedStatics: {
        /**
         * drag drop mode enum.
         * @enum {String} KISSY.DD.Draggable.DropMode
         */
        DropMode: {
            /**
             * In point mode, a Drop is targeted by the cursor being over the Target
             */
            'POINT': 'point',
            /**
             * In intersect mode, a Drop is targeted by 'part' of the drag node being over the Target
             */
            INTERSECT: 'intersect',
            /**
             * In strict mode, a Drop is targeted by the 'entire' drag node being over the Target
             */
            STRICT: 'strict'
        }
    }
});

var _ieSelectBack;

function fixIEMouseUp() {
    doc.body.onselectstart = _ieSelectBack;
}

// prevent select text in ie
function fixIEMouseDown() {
    _ieSelectBack = doc.body.onselectstart;
    doc.body.onselectstart = fixIESelect;
}

/*
 1. keeps IE from blowing up on images as drag handlers.
 IE 在 img 上拖动时默认不能拖动（不触发 mousemove，mouseup 事件，mouseup 后接着触发 mousemove ...）
 2. 防止 html5 draggable 元素的拖放默认行为 (选中文字拖放)
 3. 防止默认的选择文本行为(??场景？)
 */
function fixDragStart(e) {
    e.preventDefault();
}

/*
 keeps IE from selecting text
 */
function fixIESelect() {
    return false;
}

/*
 鼠标按下时，查看触发源是否是属于 handler 集合，
 保存当前状态
 通知全局管理器开始作用
 */
var handlePreDragStart = function (ev) {
    var self = this,
        t = ev.target;
    if (self._checkDragStartValid(ev)) {
        if (!self._checkHandler(t)) {
            return;
        }
        self._prepare(ev);
    }
};

module.exports = Draggable;

});
KISSY.add('kg/dd/2.0.0/lib/draggable-delegate',["node","./ddm","./draggable"],function(S ,require, exports, module) {
/**
 * @ignore
 * delegate all draggable nodes to one draggable object
 * @author yiminghe@gmail.com
 */
var Node = require('node'),
    DDM = require('./ddm'),
    Draggable = require('./draggable');
var PREFIX_CLS = DDM.PREFIX_CLS,
    $ = Node.all;

/*
 ���������� mousedown���ҵ����ʵ��϶� handlers �Լ��϶��ڵ�
 */
var handlePreDragStart = function (ev) {
    var self = this,
        handler,
        node;

    if (!self._checkDragStartValid(ev)) {
        return;
    }

    var handlers = self.get('handlers'),
        target = $(ev.target);

    // ����Ҫ�� Draggable һ�����ж� target �Ƿ��� handler ��
    // ί��ʱ��ֱ�Ӵ� target ��ʼ������ handler
    if (handlers.length) {
        handler = self._getHandler(target);
    } else {
        handler = target;
    }

    if (handler) {
        node = self._getNode(handler);
    }

    // can not find handler or can not find matched node from handler
    // just return !
    if (!node) {
        return;
    }

    self.setInternal('activeHandler', handler);

    // �ҵ� handler ȷ�� ί�е� node �������ɹ���
    self.setInternal('node', node);
    self.setInternal('dragNode', node);
    self._prepare(ev);
};

/**
 * @extends KISSY.DD.Draggable
 * @class KISSY.DD.DraggableDelegate
 * drag multiple nodes under a container element
 * using only one draggable instance as a delegate.
 */
var DraggableDelegate = Draggable.extend({

        // override Draggable
        _onSetNode: function () {

        },

        '_onSetContainer': function () {
            this.bindDragEvent();
        },

        _onSetDisabledChange: function (d) {
            this.get('container')[d ? 'addClass' :
                'removeClass'](PREFIX_CLS + '-disabled');
        },

        bindDragEvent: function () {
            var self = this,
                node = self.get('container');
            node.on(Node.Gesture.start, handlePreDragStart, self)
                .on('dragstart', self._fixDragStart);
        },

        detachDragEvent: function () {
            var self = this;
            self.get('container')
                .detach(Node.Gesture.start, handlePreDragStart, self)
                .detach('dragstart', self._fixDragStart);
        },

        /*
         �õ��ʺ� handler�������￪ʼ�����Ϸţ����� handlers ѡ�����ַ�������
         */
        _getHandler: function (target) {
            var self = this,
                node = self.get('container'),
                handlers = self.get('handlers');
            while (target && target[0] !== node[0]) {
                for (var i = 0; i < handlers.length; i++) {
                    var h = handlers[i];
                    if (target.test(h)) {
                        return target;
                    }
                }
                target = target.parent();
            }
            return null;
        },

        /*
         �ҵ�����Ӧ���ƶ��Ľڵ㣬��Ӧ selector ����ѡ�����ַ���
         */
        _getNode: function (h) {
            return h.closest(this.get('selector'), this.get('container'));
        }
    },
    {
        ATTRS: {
            /**
             * a selector query to get the container to listen for mousedown events on.
             * All 'draggable selector' should be a child of this container
             * @cfg {HTMLElement|String} container
             */
            /**
             * @ignore
             */
            container: {
                setter: function (v) {
                    return $(v);
                }
            },

            /**
             * a selector query to get the children of container to make draggable elements from.
             * usually as for tag.cls.
             * @cfg {String} selector
             */
            /**
             * @ignore
             */
            selector: {
            },

            /**
             * handlers to initiate drag operation.
             * can only be as form of tag.cls.
             * default {@link #selector}
             * @cfg {String[]} handlers
             **/
            /**
             * @ignore
             */
            handlers: {
                value: [],
                // ���Ǹ����� getter ������ normalize �ɽڵ�
                getter: 0
            }
        }
    });

module.exports = DraggableDelegate;
});
KISSY.add('kg/dd/2.0.0/lib/droppable-delegate',["node","./ddm","./droppable"],function(S ,require, exports, module) {
/**
 * @ignore
 * only one droppable instance for multiple droppable nodes
 * @author yiminghe@gmail.com
 */
var Node = require('node'),
    DDM = require('./ddm'),
    Droppable = require('./droppable');

function dragStart() {
    var self = this,
        container = self.get('container'),
        allNodes = [],
        selector = self.get('selector');
    container.all(selector).each(function (n) {
        // 2012-05-18: 缓存高宽，提高性能
        DDM.cacheWH(n);
        allNodes.push(n);
    });
    self.__allNodes = allNodes;
}

/**
 * @class KISSY.DD.DroppableDelegate
 * @extend KISSY.DD.Droppable
 * Make multiple nodes droppable under a container using only one droppable instance.
 */
var DroppableDelegate = Droppable.extend({

    initializer: function () {
        // 提高性能，拖放开始时缓存代理节点
        DDM.on('dragstart', dragStart, this);
    },

    /**
     * get droppable node by delegation
     * @protected
     */
    getNodeFromTarget: function (ev, dragNode, proxyNode) {
        var pointer = {
                left: ev.pageX,
                top: ev.pageY
            },
            self = this,
            allNodes = self.__allNodes,
            ret = 0,
            vArea = Number.MAX_VALUE;

        if (allNodes) {
            S.each(allNodes, function (n) {
                var domNode = n[0];
                // 排除当前拖放的元素以及代理节点
                if (domNode === proxyNode || domNode === dragNode) {
                    return;
                }
                var r = DDM.region(n);
                if (DDM.inRegion(r, pointer)) {
                    // 找到面积最小的那个
                    var a = DDM.area(r);
                    if (a < vArea) {
                        vArea = a;
                        ret = n;
                    }
                }
            });
        }

        if (ret) {
            self.setInternal('lastNode', self.get('node'));
            self.setInternal('node', ret);
        }

        return ret;
    },

    _handleOut: function () {
        var self = this;
        self.callSuper();
        var lastNode = self.get('lastNode') || 0;
        self.setInternal('node', lastNode);
        self.setInternal('lastNode', lastNode);
    },

    _handleOver: function (ev) {
        var self = this,
            node = self.get('node'),
            superOut = DroppableDelegate.superclass._handleOut,
            superOver = self.callSuper,
            superEnter = DroppableDelegate.superclass._handleEnter,
            lastNode = self.get('lastNode');

        if (lastNode[0] !== node[0]) {

            // 同一个 drop 对象内委托的两个可 drop 节点相邻，先通知上次的离开
            self.setInternal('node', lastNode);
            superOut.apply(self, arguments);

            // 再通知这次的进入
            self.setInternal('node', node);
            superEnter.call(self, ev);
        } else {
            superOver.call(self, ev);
        }
    },

    _end: function (e) {
        var self = this;
        self.callSuper(e);
        var lastNode = self.get('lastNode') || 0;
        self.setInternal('node', lastNode);
        self.setInternal('lastNode', lastNode);
    }
}, {
    ATTRS: {

        /**
         * last droppable target node.
         * @property lastNode
         * @private
         */
        /**
         * @ignore
         */
        lastNode: {
        },

        /**
         * a selector query to get the children of container to make droppable elements from.
         * usually as for tag.cls.
         * @cfg {String} selector
         */
        /**
         * @ignore
         */
        selector: {
        },

        /**
         * a selector query to get the container to listen for mousedown events on.
         * All 'draggable selector' should be a child of this container
         * @cfg {String|HTMLElement} container
         */
        /**
         * @ignore
         */
        container: {
            setter: function (v) {
                return Node.one(v);
            }
        }
    }
});

module.exports = DroppableDelegate;

});
KISSY.add('kg/dd/2.0.0/lib/droppable',["node","./ddm","base"],function(S ,require, exports, module) {
/**
 * @ignore
 * droppable for kissy
 * @author yiminghe@gmail.com
 */
var Node = require('node'),
    DDM = require('./ddm'),
    Base = require('base');

var PREFIX_CLS = DDM.PREFIX_CLS;

function validDrop(dropGroups, dragGroups) {
    if (dragGroups === true) {
        return 1;
    }
    for (var d in dropGroups) {
        if (dragGroups[d]) {
            return 1;
        }
    }
    return 0;
}

/**
 * @class KISSY.DD.Droppable
 * @extends KISSY.Base
 * Make a node droppable.
 */
var Droppable = Base.extend({
    initializer: function () {
        var self = this;
        self.addTarget(DDM);

        /**
         * fired after a draggable leaves a droppable
         * @event dropexit
         * @member KISSY.DD.DDM
         * @param e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */

        /**
         *
         * fired after a draggable leaves a droppable
         * @event dropexit
         * @member KISSY.DD.Droppable
         * @param e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */


        /**
         * fired after a draggable object mouseenter a droppable object
         * @event dropenter
         * @member KISSY.DD.DDM
         * @param e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */

        /**
         * fired after a draggable object mouseenter a droppable object
         * @event dropenter
         * @member KISSY.DD.Droppable
         * @param e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */


        /**
         *
         * fired after a draggable object mouseover a droppable object
         * @event dropover
         * @member KISSY.DD.DDM
         * @param e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */

        /**
         *
         * fired after a draggable object mouseover a droppable object
         * @event dropover
         * @member KISSY.DD.Droppable
         * @param e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */


        /**
         *
         * fired after drop a draggable onto a droppable object
         * @event drophit
         * @member KISSY.DD.DDM
         * @param e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */

        /**
         *
         * fired after drop a draggable onto a droppable object
         * @event drophit
         * @member KISSY.DD.Droppable
         * @param e
         * @param e.drag current draggable object
         * @param e.drop current droppable object
         */

        DDM._regDrop(this);
    },
    /**
     * Get drop node from target
     * @protected
     */
    getNodeFromTarget: function (ev, dragNode, proxyNode) {
        var node = this.get('node'),
            domNode = node[0];
        // 排除当前拖放和代理节点
        return domNode === dragNode ||
            domNode === proxyNode ? null : node;
    },

    _active: function () {
        var self = this,
            drag = DDM.get('activeDrag'),
            node = self.get('node'),
            dropGroups = self.get('groups'),
            dragGroups = drag.get('groups');
        if (validDrop(dropGroups, dragGroups)) {
            DDM._addValidDrop(self);
            // 委托时取不到节点
            if (node) {
                node.addClass(PREFIX_CLS + 'drop-active-valid');
                DDM.cacheWH(node);
            }
        } else if (node) {
            node.addClass(PREFIX_CLS + 'drop-active-invalid');
        }
    },

    _deActive: function () {
        var node = this.get('node');
        if (node) {
            node.removeClass(PREFIX_CLS + 'drop-active-valid')
                .removeClass(PREFIX_CLS + 'drop-active-invalid');
        }
    },

    __getCustomEvt: function (ev) {
        return S.mix({
            drag: DDM.get('activeDrag'),
            drop: this
        }, ev);
    },

    _handleOut: function () {
        var self = this,
            ret = self.__getCustomEvt();
        self.get('node').removeClass(PREFIX_CLS + 'drop-over');

        // html5 => dragleave
        self.fire('dropexit', ret);
    },

    _handleEnter: function (ev) {
        var self = this,
            e = self.__getCustomEvt(ev);
        e.drag._handleEnter(e);
        self.get('node').addClass(PREFIX_CLS + 'drop-over');
        self.fire('dropenter', e);
    },


    _handleOver: function (ev) {
        var self = this,
            e = self.__getCustomEvt(ev);
        e.drag._handleOver(e);
        self.fire('dropover', e);
    },

    _end: function () {
        var self = this,
            ret = self.__getCustomEvt();
        self.get('node').removeClass(PREFIX_CLS + 'drop-over');
        self.fire('drophit', ret);
    },

    /**
     * make this droppable' element undroppable
     * @private
     */
    destructor: function () {
        DDM._unRegDrop(this);
    }
}, {
    name: 'Droppable',

    ATTRS: {
        /**
         * droppable element
         * @cfg {String|HTMLElement|KISSY.NodeList} node
         * @member KISSY.DD.Droppable
         */
        /**
         * droppable element
         * @type {KISSY.NodeList}
         * @property node
         * @member KISSY.DD.Droppable
         */
        /**
         * @ignore
         */
        node: {
            setter: function (v) {
                if (v) {
                    return Node.one(v);
                }
            }
        },

        /**
         * groups this droppable object belongs to.
         * @cfg {Object|Boolean} groups
         * @member KISSY.DD.Droppable
         */
        /**
         * @ignore
         */
        groups: {
            value: {

            }
        },

        /**
         * whether droppable is disabled
         * @type {Boolean}
         * @property disabled
         * @member KISSY.DD.Droppable
         */
        /**
         * @ignore
         */
        disabled:{

        }
    }
});

module.exports = Droppable;
});
KISSY.add('kg/dd/2.0.0/lib/plugin/constrain',["node","base"],function(S ,require, exports, module) {
/**
 * @ignore
 * plugin constrain region for drag and drop
 * @author yiminghe@gmail.com
 */
var Node = require('node'),
    Base = require('base');
var $ = Node.all,
    CONSTRAIN_EVENT = '.-ks-constrain' + S.now(),
    WIN = S.Env.host;

function onDragStart(e) {
    var self = this,
        drag = e.drag,
        l, t, lt,
        dragNode = drag.get('dragNode'),
        constrain = self.get('constrain');
    if (constrain) {
        if (S.isWindow(constrain[0])) {
            self.__constrainRegion = {
                left: l = constrain.scrollLeft(),
                top: t = constrain.scrollTop(),
                right: l + constrain.width(),
                bottom: t + constrain.height()
            };
        }
        else if (constrain.getDOMNode) {
            lt = constrain.offset();
            self.__constrainRegion = {
                left: lt.left,
                top: lt.top,
                right: lt.left + constrain.outerWidth(),
                bottom: lt.top + constrain.outerHeight()
            };
        } else if (S.isPlainObject(constrain)) {
            self.__constrainRegion = constrain;
        }
        if (self.__constrainRegion) {
            self.__constrainRegion.right -= dragNode.outerWidth();
            self.__constrainRegion.bottom -= dragNode.outerHeight();
        }
    }
}

function onDragAlign(e) {
    var self = this,
        info = {},
        l = e.left,
        t = e.top,
        constrain = self.__constrainRegion;
    if (constrain) {
        info.left = Math.min(Math.max(constrain.left, l), constrain.right);
        info.top = Math.min(Math.max(constrain.top, t), constrain.bottom);
        e.drag.setInternal('actualPos', info);
    }
}

function onDragEnd() {
    this.__constrainRegion = null;
}

/**
 * @class KISSY.DD.Plugin.Constrain
 * @extends KISSY.Base
 * Constrain plugin to provide ability to constrain draggable to specified region
 */
module.exports = Base.extend({

//    pluginId: 'dd/plugin/constrain',

    __constrainRegion: null,

    /**
     * start monitoring drag
     * @param {KISSY.DD.Draggable} drag
     * @private
     */
    pluginInitializer: function (drag) {
        var self = this;
        drag.on('dragstart' + CONSTRAIN_EVENT, onDragStart, self)
            .on('dragend' + CONSTRAIN_EVENT, onDragEnd, self)
            .on('dragalign' + CONSTRAIN_EVENT, onDragAlign, self);
    },

    /**
     * stop monitoring drag
     * @param {KISSY.DD.Draggable} drag
     * @private
     */
    pluginDestructor: function (drag) {
        drag.detach(CONSTRAIN_EVENT, {
            context: this
        });
    }
}, {
    ATTRS: {
        /**
         * constrained container.
         * @type {Boolean|HTMLElement|String}
         * @property constrain
         */

        /**
         * constrained container. true stands for viewport.
         * Defaults: true.
         * @cfg {Boolean|HTMLElement|String} constrain
         */

        /**
         * @ignore
         */
        constrain: {
            value: $(WIN),
            setter: function (v) {
                if (v) {
                    if (v === true) {
                        return $(WIN);
                    } else if (v.nodeType || S.isWindow(v) ||
                        typeof v === 'string') {
                        return $(v);
                    }
                }
                return v;
            }
        }
    }
});
});
KISSY.add('kg/dd/2.0.0/lib/plugin/proxy',["node","../ddm","base"],function(S ,require, exports, module) {
/**
 * @ignore
 * generate proxy drag object,
 * @author yiminghe@gmail.com
 */
var Node = require('node'),
    DD = require('../ddm'),
    Base = require('base');

var PROXY_EVENT = '.-ks-proxy' + S.now();

/**
 * @extends KISSY.Base
 * @class KISSY.DD.Plugin.Proxy
 * Proxy plugin to provide abilities for draggable tp create a proxy drag node,
 * instead of dragging the original node.
 */
module.exports = Base.extend({

//    pluginId: 'dd/plugin/proxy',

    /**
     * make this draggable object can be proxied.
     * @param {KISSY.DD.Draggable} drag
     * @private
     */
    pluginInitializer: function (drag) {
        var self = this, hideNodeOnDrag = self.get('hideNodeOnDrag');

        function start() {
            var node = self.get('node'),
                dragNode = drag.get('node');
            // cache proxy node
            if (!self.get('proxyNode')) {
                if (typeof node === 'function') {
                    node = node(drag);
                    node.addClass('ks-dd-proxy');
                    self.set('proxyNode', node);
                }
            } else {
                node = self.get('proxyNode');
            }
            node.show();
            dragNode.parent().append(node);
            DDM.cacheWH(node);
            node.offset(dragNode.offset());
            drag.setInternal('dragNode', dragNode);
            drag.setInternal('node', node);
            if (hideNodeOnDrag) {
                dragNode.css('visibility', 'hidden');
            }
        }

        function end() {
            var node = self.get('proxyNode'),
                dragNode = drag.get('dragNode');
            if (self.get('moveOnEnd')) {
                dragNode.offset(node.offset());
            }
            if (self.get('destroyOnEnd')) {
                node.remove();
                self.set('proxyNode', 0);
            } else {
                node.hide();
            }
            drag.setInternal('node', dragNode);
            if (hideNodeOnDrag) {
                dragNode.css('visibility', '');
            }
        }

        drag.on('dragstart' + PROXY_EVENT, start)
            .on('dragend' + PROXY_EVENT, end);
    },
    /**
     * make this draggable object unproxied
     * @param {KISSY.DD.Draggable} drag
     * @private
     */
    pluginDestructor: function (drag) {
        drag.detach(PROXY_EVENT);
    }
}, {
    ATTRS: {
        /**
         * how to get the proxy node.
         * default clone the node itself deeply.
         * @cfg {Function} node
         */
        /**
         * @ignore
         */
        node: {
            value: function (drag) {
                return new Node(drag.get('node').clone(true));
            }
        },

        /**
         * whether hide original node when drag proxy.
         * Defaults to: false
         * @cfg {Boolean} hideNodeOnDrag
         */
        /**
         * @ignore
         */
        hideNodeOnDrag: {
            value: false
        },

        /**
         * destroy the proxy node at the end of this drag.
         * default false
         * @cfg {Boolean} destroyOnEnd
         */
        /**
         * @ignore
         */
        destroyOnEnd: {
            value: false
        },

        /**
         * move the original node at the end of the drag.
         * default true
         * @cfg {Boolean} moveOnEnd
         */
        /**
         * @ignore
         */
        moveOnEnd: {
            value: true
        },

        /**
         * Current proxy node.
         * @type {KISSY.NodeList}
         * @property proxyNode
         */
        /**
         * @ignore
         */
        proxyNode: {

        }
    }
});
});
KISSY.add('kg/dd/2.0.0/lib/plugin/scroll',["node","../ddm","base"],function(S ,require, exports, module) {
/**
 * @ignore
 * auto scroll for drag object's container
 * @author yiminghe@gmail.com
 */
var Node = require('node'),
    DDM = require('../ddm'),
    Base = require('base');
var win = S.Env.host,
    SCROLL_EVENT = '.-ks-dd-scroll' + S.now(),
    RATE = [10, 10],
    ADJUST_DELAY = 100,
    DIFF = [20, 20],
    isWin = S.isWindow;

/**
 * @class KISSY.DD.Plugin.Scroll
 * @extends KISSY.Base
 * Scroll plugin to make parent node scroll while dragging.
 */
module.exports = Base.extend({

    pluginId: 'dd/plugin/scroll',

    /**
     * Get container node region.
     * @private
     */
    getRegion: function (node) {
        if (isWin(node[0])) {
            return {
                width: node.width(),
                height: node.height()
            };
        } else {
            return {
                width: node.outerWidth(),
                height: node.outerHeight()
            };
        }
    },

    /**
     * Get container node offset.
     * @private
     */
    getOffset: function (node) {
        if (isWin(node[0])) {
            return {
                left: node.scrollLeft(),
                top: node.scrollTop()
            };
        } else {
            return node.offset();
        }
    },

    /**
     * Get container node scroll.
     * @private
     */
    getScroll: function (node) {
        return {
            left: node.scrollLeft(),
            top: node.scrollTop()
        };
    },

    /**
     * scroll container node.
     * @private
     */
    setScroll: function (node, r) {
        node.scrollLeft(r.left);
        node.scrollTop(r.top);
    },

    /**
     * make node not to scroll while this drag object is dragging
     * @param {KISSY.DD.Draggable} drag
     * @private
     */
    pluginDestructor: function (drag) {
        drag.detach(SCROLL_EVENT);
    },

    /**
     * make node to scroll while this drag object is dragging
     * @param {KISSY.DD.Draggable} drag
     * @private
     */
    pluginInitializer: function (drag) {
        var self = this,
            node = self.get('node');

        var rate = self.get('rate'),
            diff = self.get('diff'),
            event,
        // Ŀǰ���� container ��ƫ�ƣ�container Ϊ window ʱ�������� viewport
            dxy,
            timer = null;

        // fix https://github.com/kissyteam/kissy/issues/115
        // dragDelegate ʱ ����һ�� dragDelegate��Ӧ���� scroll
        // check container
        function checkContainer() {
            if (isWin(node[0])) {
                return 0;
            }
            // �ж� proxyNode������ dragNode �����ĸı�
            var mousePos = drag.mousePos,
                r = DDM.region(node);

            if (!DDM.inRegion(r, mousePos)) {
                clearTimeout(timer);
                timer = 0;
                return 1;
            }
            return 0;
        }

        function dragging(ev) {
            // �������ߵ��¼������ܲ���Ҫ����
            // fake Ҳ��ʾ���¼�������Ϊ mouseover ������
            if (ev.fake) {
                return;
            }

            if (checkContainer()) {
                return;
            }

            // ���µ�ǰ�����������Ͻڵ�������λ��
            event = ev;
            dxy = S.clone(drag.mousePos);
            var offset = self.getOffset(node);
            dxy.left -= offset.left;
            dxy.top -= offset.top;
            if (!timer) {
                checkAndScroll();
            }
        }

        function dragEnd() {
            clearTimeout(timer);
            timer = null;
        }

        drag.on('drag' + SCROLL_EVENT, dragging);

        drag.on('dragstart' + SCROLL_EVENT, function () {
            DDM.cacheWH(node);
        });

        drag.on('dragend' + SCROLL_EVENT, dragEnd);

        function checkAndScroll() {
            if (checkContainer()) {
                return;
            }

            var r = self.getRegion(node),
                nw = r.width,
                nh = r.height,
                scroll = self.getScroll(node),
                origin = S.clone(scroll),
                diffY = dxy.top - nh,
                adjust = false;

            if (diffY >= -diff[1]) {
                scroll.top += rate[1];
                adjust = true;
            }

            var diffY2 = dxy.top;

            if (diffY2 <= diff[1]) {
                scroll.top -= rate[1];
                adjust = true;
            }

            var diffX = dxy.left - nw;

            if (diffX >= -diff[0]) {
                scroll.left += rate[0];
                adjust = true;
            }

            var diffX2 = dxy.left;

            if (diffX2 <= diff[0]) {
                scroll.left -= rate[0];
                adjust = true;
            }

            if (adjust) {
                self.setScroll(node, scroll);
                timer = setTimeout(checkAndScroll, ADJUST_DELAY);
                // ��ϣ����������ֵ���ر��������� window ʱ������ֵ�����������ϷŴ����� drag���ǲ����ģ�
                // ������Ϊ���� scroll ���ı�����ֵ

                // �����¼�������Ҫ scroll ���أ��ﵽԤ�ڽ�����Ԫ���������ĳ������Ϲ򶯶��Զ�����λ��.
                event.fake = true;
                if (isWin(node[0])) {
                    // ��ʹ window �Զ�����ʱ��ҲҪʹ���Ϸ����������ĵ�λ���� scroll �ı�
                    // ������ node ����ʱ��ֻ�� node �����򶯣��϶����������ĵ�λ�ò���Ҫ�ı�
                    scroll = self.getScroll(node);
                    event.left += scroll.left - origin.left;
                    event.top += scroll.top - origin.top;
                }
                // ���������ˣ�Ԫ��ҲҪ�������� left,top
                if (drag.get('move')) {
                    drag.get('node').offset(event);
                }
                drag.fire('drag', event);
            } else {
                timer = null;
            }
        }
    }
}, {
    ATTRS: {
        /**
         * node to be scrolled while dragging
         * @cfg {Window|String|HTMLElement} node
         */
        /**
         * @ignore
         */
        node: {
            // value:window�����У�Ĭ��ֵһ���Ǽ򵥶���
            valueFn: function () {
                return Node.one(win);
            },
            setter: function (v) {
                return Node.one(v);
            }
        },
        /**
         * adjust velocity, larger faster
         * default [10,10]
         * @cfg {Number[]} rate
         */
        /**
         * @ignore
         */
        rate: {
            value: RATE
        },
        /**
         * the margin to make node scroll, easier to scroll for node if larger.
         * default  [20,20]
         * @cfg {number[]} diff
         */
        /**
         * @ignore
         */
        diff: {
            value: DIFF
        }
    }
});
});