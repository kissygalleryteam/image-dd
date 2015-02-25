/**
 * @module  draggable-spec
 * @author yiminghe@gmail.com
 * ie9 模式下 mousemove 触发事件有问题，无法测试
 */

var $ = require('node'),
    win = $(window),
    DD = require('dd'),
    IO = require('io');
var UA = require('ua');
var Draggable = DD.Draggable;

var ie = UA.ieMode;
if (ie === 9 || ie === 11) {
    return;
}

describe('draggable', function () {
    var html = '';

    IO({
        url: './specs/draggable.fragment.html',
        async: false,
        success: function (data) {
            html = data;
            $('body').append(html);
        }
    });

    it('should not drag before mousedown while mousemove', function (done) {
        var drag = $('#drag_before'),
            dragHeader = $('#dragHeader_before');
        var action = new Draggable({
                node: drag,
                move: 1,
                handlers: [dragHeader],
                groups: false
            }),
            scrollLeft = win.scrollLeft(),
            scrollTop = win.scrollTop();

        async.series([
            waits(300),
            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: -100 - scrollLeft,
                    clientY: -100 - scrollTop
                });
            }),
            waits(50),
            runs(function () {
                var expected = 500;
                //if (ie == 7) expected += 2;
                expect(drag.offset().top - expected).to.within(-6, 6);
                expect(drag.offset().left - expected).to.within(-6, 6);
                window.simulateEvent(document, 'mouseup');
                action.destroy();
            })], done);
    });

    it('should drag after mousedown while mousemove after exceeding clickPixelThresh', function (done) {
        var drag = $('#drag'),
            dragHeader = $('#dragHeader'),
            scrollLeft = win.scrollLeft(),
            scrollTop = win.scrollTop();
        var action = new Draggable({
            node: drag,
            move: 1,
            handlers: [dragHeader],
            groups: false
        });

        var xy = dragHeader.offset();

        window.simulateEvent(dragHeader[0], 'mousedown', {
            clientX: xy.left - scrollLeft,
            clientY: xy.top - scrollTop
        });

        function move() {
            window.simulateEvent(document, 'mousemove', {
                clientX: xy.left - 10 - scrollLeft,
                clientY: xy.top - 10 - scrollTop
            });
        }

        var tasks = [];
        for (var i = 0; i < 10; i++) {
            tasks.push(waits(30));
            // 10px move to start
            tasks.push(runs(move));
        }

        tasks.push(waits(100));
        tasks.push(runs(function () {
            window.simulateEvent(document, 'mousemove', {
                clientX: xy.left - 100 - scrollLeft,
                clientY: xy.top - 100 - scrollTop
            });
        }));

        tasks.push(waits(300));

        tasks.push(runs(function () {
            window.simulateEvent(document, 'mouseup', {
                clientX: xy.left - 100 - scrollLeft,
                clientY: xy.top - 100 - scrollTop
            });
        }));

        tasks.push(waits(300));
        tasks.push(runs(function () {
            var expected = 450;
            //if (ie == 7) expected += 2;
            expect(drag.offset().top - expected).to.within(-6, 6);
            expect(drag.offset().left - expected).to.within(-6, 6);
            action.destroy();
        }));

        async.series(tasks, done);
    });

    it('should not drag after mouseup while mousemove', function (done) {
        var drag = $('#drag_after'),
            dragHeader = $('#dragHeader_after');

        var action = new Draggable({
            node: drag,
            move: 1,
            handlers: [dragHeader],
            groups: false
        });

        var xy = dragHeader.offset();

        async.series([
            runs(function () {
                window.simulateEvent(dragHeader[0], 'mousedown', {
                    clientX: xy.left - win.scrollLeft(),
                    clientY: xy.top - win.scrollTop()
                });
            }),
            waits(100),

            // 10px move to start
            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: xy.left - 10 - win.scrollLeft(),
                    clientY: xy.top - 10 - win.scrollTop()
                });
            }),

            waits(100),
            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: xy.left + 100 - win.scrollLeft(),
                    clientY: xy.top + 100 - win.scrollTop()
                });
            }),
            waits(300),

            runs(function () {
                window.simulateEvent(document, 'mouseup', {
                    clientX: xy.left + 100 - win.scrollLeft(),
                    clientY: xy.top + 100 - win.scrollTop()
                });
            }),
            waits(300),
            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: xy.left - 300 - win.scrollLeft(),
                    clientY: xy.top - 300 - win.scrollTop()
                });
            }),
            runs(function () {
                var expected = 100;
                //if (ie == 7) expected += 2;
                expect(drag.offset().top - xy.top - expected).to.within(-6, 6);
                expect(drag.offset().left - xy.left - expected).to.within(-6, 6);
                action.destroy();
            })], done);
    });

    it('disabled works', function (done) {
        var drag = $('#drag'),
            dragHeader = $('#dragHeader');

        var action = new Draggable({
            node: drag,
            disabled: true,
            move: 1,
            handlers: [dragHeader],
            groups: false
        });

        var xy = dragHeader.offset();

        window.simulateEvent(dragHeader[0], 'mousedown', {
            clientX: xy.left - win.scrollLeft(),
            clientY: xy.top - win.scrollTop()
        });

        // exceed bufferTime
        async.series([
            waits(1100),

            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: xy.left + 100 - win.scrollLeft(),
                    clientY: xy.top + 100 - win.scrollTop()
                });
            }),

            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mouseup', {
                    clientX: xy.left + 100 - win.scrollLeft(),
                    clientY: xy.top + 100 - win.scrollTop()
                });
            }),

            waits(100),
            runs(function () {
                var expected = 0;
                expect(drag.offset().top - xy.top - expected).to.within(-6, 6);
                expect(drag.offset().left - xy.left - expected).to.within(-6, 6);
                action.destroy();
            }),
            runs(function () {
                $('#drag_before').remove();
                $('#drag').remove();
                $('#drag_after').remove();
            })
        ], done);
    });
});