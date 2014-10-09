/**
 * @ignore
 * dd support for kissy
 * @author yiminghe@gmail.com
 */
var DDM = require('./lib/ddm'),
    Draggable = require('./lib/draggable'),
    DraggableDelegate = require('./lib/draggable-delegate'),
    DroppableDelegate = require('./lib/droppable-delegate'),
    Droppable = require('./lib/droppable');
var DD = {
    Draggable: Draggable,
    DDM: DDM,
    Droppable: Droppable,
    DroppableDelegate: DroppableDelegate,
    DraggableDelegate: DraggableDelegate
};

KISSY.DD = DD;

module.exports = DD;