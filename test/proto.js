var assert = require('assert');
var proto = require('dnode-protocol');
var Traverse = require('traverse');

exports.protoHashes = function () {
    var server = proto({
        x : function (f, g) {
            setTimeout(f.bind({}, 7, 8, 9), 50);
            setTimeout(g.bind({}, [ 'q', 'r' ]), 100);
        },
        y : 555,
    });
    
    var client = proto({});
    
    var s = server.create();
    var c = client.create();
    
    var sreqs = [];
    s.on('request', function (req) {
        sreqs.push(Traverse.clone(req));
        c.handle(req);
    });
    
    var creqs = [];
    c.on('request', function (req) {
        creqs.push(Traverse.clone(req));
        s.handle(req);
    });
    
    var tf = setTimeout(function () {
        assert.fail('never called f');
    }, 5000);
    
    var tg = setTimeout(function () {
        assert.fail('never called g');
    }, 5000);
    
    s.start();
    
    assert.eql(sreqs, [ {
        method : 'methods',
        arguments : [ { x : '[Function]', y : 555 } ],
        callbacks : { 0 : [ '0', 'x' ] },
        links : [],
    } ]);
    
    c.request('x', [
        function (x, y , z) {
            clearTimeout(tf); 
            assert.eql([ x, y, z ], [ 7, 8, 9 ]);
        },
        function (qr) {
            clearTimeout(tg);
            assert.eql(qr, [ 'q', 'r' ]);
        }
    ]);
    
    assert.eql(creqs, [ {
        method : 'x',
        arguments : [ '[Function]', '[Function]' ],
        callbacks : { 0 : [ '0' ], 1 : [ '1' ] },
        links : [],
    } ]);
};
