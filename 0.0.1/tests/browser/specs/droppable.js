/**
 * @module  droppable-spec
 * @author yiminghe@gmail.com
 */

var $ = require('node'),
    win = $(window),
    DD = require('dd'),
    DDM = DD.DDM,
    IO = require('io');
var UA = require('ua');
var Droppable = DD.Droppable;
var Draggable = DD.Draggable;

var ie = UA.ieMode;

if (ie === 9 || ie === 11) {
    return;
}

describe('droppable', function () {
    describe('mode == point', function () {
        var html = '';

        IO({
            url: './specs/droppable.fragment.html',
            async: false,
            success: function (data) {
                html = data;
            }
        });

        var container;

        //beforeEach(function () {
        container = $(html);
        $('body').append(container);
        //});


        //afterEach(function () {
        //    container.remove();
        //});

        var drag, drop, dragNode, dragXy, dropNode, dropXy;
        drag = new Draggable({
            mode: 'point',
            move: 1,
            node: '#drag_mode'
        });

        drop = new Droppable({
            node: '#drop_mode'
        });
        dragNode = drag.get('dragNode');
        dragXy = dragNode.offset();
        dropNode = drop.get('node');
        dropXy = dropNode.offset();

        it('should fire dragenter properly', function (done) {
            window.simulateEvent(dragNode[0], 'mousedown', {
                clientX: dragXy.left + 10 - win.scrollLeft(),
                clientY: dragXy.top + 10 - win.scrollTop()
            });

            var d1, d2;
            var callCount = 0, callCountFn;

            async.series([
                waits(100),

                // 10px move to start
                runs(function () {
                    window.simulateEvent(document, 'mousemove', {
                        clientX: dragXy.left + 15 - win.scrollLeft(),
                        clientY: dragXy.top + 15 - win.scrollTop()
                    });
                }),

                waits(100),

                runs(function () {
                    drag.on('dragenter', callCountFn = function () {
                        callCount++;
                    });
                }),

                runs(function () {
                    window.simulateEvent(document, 'mousemove', {
                        clientX: dropXy.left + 10 - win.scrollLeft(),
                        clientY: dropXy.top + 10 - win.scrollTop()
                    });
                }),

                waits(100),

                //中间不加间隔

                runs(function () {
                    d1 = DDM.get('activeDrop');
                    expect(callCount).to.be(1);
                }),

                runs(function () {
                    window.simulateEvent(document, 'mousemove', {
                        clientX: dropXy.left + 20 - win.scrollLeft(),
                        clientY: dropXy.top + 20 - win.scrollTop()
                    });
                }),
                waits(100),
                runs(function () {
                    d2 = DDM.get('activeDrop');
                    expect(callCount).to.be(1);
                    drag.detach('dragenter', callCountFn);
                })], done);
        });

        it('should fire dragover properly', function (done) {
            if (UA.ie === 6) {
                return;
            }

            var callCount = 0;

            var dragoverSpy = function () {
                callCount++;
            };

            drag.on('dragover', dragoverSpy);

            window.simulateEvent(document, 'mousemove', {
                clientX: dropXy.left + 25 - win.scrollLeft(),
                clientY: dropXy.top + 25 - win.scrollTop()
            });

            async.series([
                waits(100),

                runs(function () {
                    expect(callCount).to.be(1);
                }),

                runs(function () {
                    window.simulateEvent(document, 'mousemove', {
                        clientX: dropXy.left + 20 - win.scrollLeft(),
                        clientY: dropXy.top + 20 - win.scrollTop()
                    });
                }),
                waits(100),

                runs(function () {
                    drag.detach('dragover', dragoverSpy);
                    expect(callCount).to.be(2);
                })], done);
        });

        it('should fire dragexit properly', function (done) {
            var dragExit = 0;
            drag.on('dragexit', function () {
                dragExit = 1;
            });
            window.simulateEvent(document, 'mousemove', {
                clientX: dropXy.left + 150 - win.scrollLeft(),
                clientY: dropXy.top + 150 - win.scrollTop()
            });
            setTimeout(function () {
                expect(dragExit).to.be(1);
                done();
            }, 100);
        });

        it('should fire dragdrophit properly', function (done) {
            var dragdropHit = 0;

            drag.on('dragdrophit', function () {
                dragdropHit = 1;
            });

            window.simulateEvent(document, 'mousemove', {
                clientX: dropXy.left + 10 - win.scrollLeft(),
                clientY: dropXy.top + 10 - win.scrollTop()
            });

            async.series([
                waits(100),

                runs(function () {
                    window.simulateEvent(document, 'mousemove', {
                        clientX: dropXy.left + 10 - win.scrollLeft(),
                        clientY: dropXy.top + 10 - win.scrollTop()
                    });
                }),

                waits(100),

                runs(function () {
                    window.simulateEvent(document, 'mouseup', {
                        clientX: dropXy.left + 10 - win.scrollLeft(),
                        clientY: dropXy.top + 10 - win.scrollTop()
                    });
                }),

                waits(100),

                runs(function () {
                    expect(dragdropHit).to.be(1);
                })], done);
        });

        it('should fire dragdropmiss properly', function (done) {
            var dragdropMiss = 0;

            dragXy = dragNode.offset();
            window.simulateEvent(dragNode[0], 'mousedown', {
                clientX: dragXy.left + 10 - win.scrollLeft(),
                clientY: dragXy.top + 10 - win.scrollTop()
            });

            async.series([
                waits(100),

                // 10px move to start
                runs(function () {
                    window.simulateEvent(document, 'mousemove', {
                        clientX: dragXy.left + 15 - win.scrollLeft(),
                        clientY: dragXy.top + 15 - win.scrollTop()
                    });
                }),

                waits(100),

                runs(function () {
                    drag.on('dragdropmiss', function () {
                        dragdropMiss = 1;
                    });
                    window.simulateEvent(document, 'mousemove', {
                        clientX: dropXy.left + 150 - win.scrollLeft(),
                        clientY: dropXy.top + 150 - win.scrollTop()
                    });
                }),

                waits(100),

                runs(function () {
                    window.simulateEvent(document, 'mouseup', {
                        clientX: dropXy.left + 150 - win.scrollLeft(),
                        clientY: dropXy.top + 150 - win.scrollTop()
                    });
                }),

                waits(100),

                runs(function () {
                    expect(dragdropMiss).to.be(1);
                }),

                runs(function () {
                    $('#drag_mode').remove();
                    $('#drop_mode').remove();
                })], done);
        });

    });
});