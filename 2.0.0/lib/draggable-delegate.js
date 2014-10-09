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

    // �ҵ� handler ȷ�� ί�е� node ������ɹ���
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
module.exports = Draggable.extend({

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
                // ���Ǹ���� getter ������ normalize �ɽڵ�
                getter: 0
            }
        }
    });