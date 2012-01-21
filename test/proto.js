var test = require('tap').test;
var proto = require('../');
var traverse = require('traverse');

test('proto hashes', function (t) {
    t.plan(7);
    
    var server = proto({
        x : function (f, g) {
            setTimeout(f.bind({}, 7, 8, 9), 50);
            setTimeout(g.bind({}, [ 'q', 'r' ]), 100);
        },
        y : 555
    });
    
    var client = proto({});
    
    var s = server.create();
    var c = client.create();
    
    var sreqs = [];
    s.on('request', function (req) {
        sreqs.push(traverse.clone(req));
        c.handle(req);
    });
    
    var creqs = [];
    c.on('request', function (req) {
        creqs.push(traverse.clone(req));
        s.handle(req);
    });
    
    s.start();
    
    t.deepEqual(sreqs, [ {
        method : 'methods',
        arguments : [ { x : '[Function]', y : 555 } ],
        callbacks : { 0 : [ '0', 'x' ] },
        links : [],
    } ]);
    
    c.start();
    
    t.deepEqual(creqs, [ {
        method : 'methods',
        arguments : [ {} ],
        callbacks : {},
        links : [],
    } ]);
    
    c.request('x', [
        function (x, y , z) {
            t.deepEqual([ x, y, z ], [ 7, 8, 9 ]);
        },
        function (qr) {
            t.deepEqual(qr, [ 'q', 'r' ]);
        }
    ]);
    
    t.deepEqual(creqs.slice(1), [ {
        method : 'x',
        arguments : [ '[Function]', '[Function]' ],
        callbacks : { 0 : [ '0' ], 1 : [ '1' ] },
        links : [],
    } ]);
    
    c.on('error', function (err) {
        t.ok(err.stack);
        t.ok(err.message.match(/^Error parsing JSON/));
        t.ok(err instanceof SyntaxError);
        t.end();
    });
    c.parse('{');
});
