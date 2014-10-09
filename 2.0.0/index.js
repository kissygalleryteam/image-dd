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