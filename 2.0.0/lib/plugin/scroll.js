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
        // Ŀǰ��� container ��ƫ�ƣ�container Ϊ window ʱ������� viewport
            dxy,
            timer = null;

        // fix https://github.com/kissyteam/kissy/issues/115
        // dragDelegate ʱ ����һ�� dragDelegate��Ӧ��� scroll
        // check container
        function checkContainer() {
            if (isWin(node[0])) {
                return 0;
            }
            // �ж� proxyNode������ dragNode ����ĸı�
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
            // �������ߵ��¼�����ܲ���Ҫ����
            // fake Ҳ��ʾ���¼�������Ϊ mouseover ������
            if (ev.fake) {
                return;
            }

            if (checkContainer()) {
                return;
            }

            // ���µ�ǰ���������Ͻڵ�����λ��
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
                // ��ϣ���������ֵ���ر������� window ʱ�����ֵ����������ϷŴ����� drag���ǲ���ģ�
                // ������Ϊ���� scroll ���ı����ֵ

                // �����¼�������Ҫ scroll ��أ��ﵽԤ�ڽ����Ԫ���������ĳ������Ϲ������Զ�����λ��.
                event.fake = true;
                if (isWin(node[0])) {
                    // ��ʹ window �Զ�����ʱ��ҲҪʹ���Ϸ���������ĵ�λ���� scroll �ı�
                    // ����� node ����ʱ��ֻ�� node �����������϶���������ĵ�λ�ò���Ҫ�ı�
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