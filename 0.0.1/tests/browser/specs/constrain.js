/**
 * @module  scroll-spec
 * @author yiminghe@gmail.com
 */

var DD = require('dd');
var Constrain = require('dd/plugin/constrain');

var Draggable = DD.Draggable,
    $ = require('node');

window.scrollTo(0, 0);

var ie = require('ua').ieMode;

if (ie === 9 || ie === 11) {
    return;
}

describe('constrain', function () {
    var node = $('<div style="width:100px;height:200px;' +
        'background:red;' +
        'position: absolute;left:0;top:0;">' +
        '</div>')
        .appendTo('body');

    var container = $('<div style="width:300px;height:500px;' +
        'position: absolute;left:0;top:0;">' +
        '</div>')
        .prependTo('body');

    var draggable = new Draggable({
        node: node,
        move: 1,
        groups: false
    });

    var constrain = new Constrain({
        constrain: container
    });

    draggable.plug(constrain);

    it('works for node', function (done) {
        node.css({
            left: 0,
            top: 0
        });

        constrain.set('constrain', container);

        window.simulateEvent(node[0], 'mousedown', {
            clientX: 10,
            clientY: 10
        });

        async.series([
            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: 30,
                    clientY: 30
                });
            }),

            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: 500,
                    clientY: 500
                });
            }),

            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mouseup', {
                    clientX: 500,
                    clientY: 500
                });
            }),

            waits(100),

            runs(function () {
                expect(node.css('left')).to.be('200px');
                expect(node.css('top')).to.be('300px');
            })], done);
    });

    it('works for window', function (done) {
        node.css({
            left: 0,
            top: 0
        });

        constrain.set('constrain', window);

        var win = $(window);

        window.simulateEvent(node[0], 'mousedown', {
            clientX: 10,
            clientY: 10
        });

        async.series([
            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: 30,
                    clientY: 30
                });
            }),

            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: 5500,
                    clientY: 5500
                });
            }),

            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mouseup', {
                    clientX: 5500,
                    clientY: 5500
                });
            }),

            waits(100),

            runs(function () {
                expect(parseInt(node.css('left'), 10)).to.be(win.width() - 100);
                expect(parseInt(node.css('top'), 10)).to.be(win.height() - 200);
            })], done);
    });

    it('works for window (true constrain)', function (done) {
        node.css({
            left: 0,
            top: 0
        });

        constrain.set('constrain', true);

        var win = $(window);

        window.simulateEvent(node[0], 'mousedown', {
            clientX: 10,
            clientY: 10
        });

        async.series([
            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: 30,
                    clientY: 30
                });
            }),

            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: 5500,
                    clientY: 5500
                });
            }),

            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mouseup', {
                    clientX: 5500,
                    clientY: 5500
                });
            }),

            waits(100),

            runs(function () {
                expect(parseInt(node.css('left'), 10)).to.be(win.width() - 100);
                expect(parseInt(node.css('top'), 10)).to.be(win.height() - 200);
            })], done);
    });

    it('can be freed (false constrain)', function (done) {
        node.css({
            left: 0,
            top: 0
        });

        constrain.set('constrain', false);

        window.simulateEvent(node[0], 'mousedown', {
            clientX: 10,
            clientY: 10
        });

        async.series([
            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: 30,
                    clientY: 30
                });
            }),

            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: 5500,
                    clientY: 5500
                });
            }),

            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mouseup', {
                    clientX: 5500,
                    clientY: 5500
                });
            }),

            waits(100),

            runs(function () {
                expect(parseInt(node.css('left'), 10)).to.be(5490);
                expect(parseInt(node.css('top'), 10)).to.be(5490);
            })], done);
    });

    it('can be freed (detach)', function (done) {
        node.css({
            left: 0,
            top: 0
        });

        constrain.set('constrain', true);

        draggable.unplug(constrain);

        window.simulateEvent(node[0], 'mousedown', {
            clientX: 10,
            clientY: 10
        });

        async.series([
            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: 30,
                    clientY: 30
                });
            }),

            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mousemove', {
                    clientX: 5500,
                    clientY: 5500
                });
            }),

            waits(100),

            runs(function () {
                window.simulateEvent(document, 'mouseup', {
                    clientX: 5500,
                    clientY: 5500
                });
            }),

            waits(100),

            runs(function () {
                expect(parseInt(node.css('left'), 10)).to.be(5490);
                expect(parseInt(node.css('top'), 10)).to.be(5490);
            })], done);
    });
});