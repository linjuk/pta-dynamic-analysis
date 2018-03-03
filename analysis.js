(function(){
  var hooks = 0;
  var count = [];
  var branches = {};
  var funList = ["_return", "_throw", "_with",
            "binaryPre", "binary", "conditional",
            "declare", "endExecution", "endExpression",
            "forinObject", "functionEnter", "functionExit",
            "getFieldPre", "getField", "instrumentCodePre",
            "instrumentCode", "invokeFunPre", "invokeFun",
            "literal", "onReady","putFieldPre",
            "putField", "read", "runInstrumentedFunctionBody",
            "scriptEnter", "scriptExit",  "unaryPre",
            "unary", "write"];

    funList.map(function(f){
        count[f] = 0;
    })

    count['declare_function'] = 0;

  J$.analysis = {

    _return: function (iid, val) {
        var id = J$.getGlobalIID(iid);
        if(id)
        {
            count['_return'] += 1;
            hooks += 1;
        }
    },

    declare: function(iid, name, val, isArgument, argumentIndex, isCatchParam) {
        var id = J$.getGlobalIID(iid);

        if(id)
        {
            if(typeof val === 'function')
                count['declare_function'] += 1;

            count['declare'] += 1;

        }
    },

    conditional : function (iid, result) {
            var id = J$.getGlobalIID(iid);
            var branchInfo = branches[id];
            if (!branchInfo) {
                branchInfo = branches[id] = {trueCount: 0, falseCount: 0};
            }
        },

    invokeFun : function(iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid){
        var id = J$.getGlobalIID(iid);
        if(id)
        {
            count['invokeFun'] += 1;
        }
    },

    read: function(iid, name, val, isGlobal, isScriptLocal) {
        var id = J$.getGlobalIID(iid);
        if(id)
        {
            count['read'] += 1;
        }
    },

    write: function(iid, name, val, lhs, isGlobal, isScriptLocal) {
        var id = J$.getGlobalIID(iid);
        if(id)
        {
            count['write'] += 1;
        }
    },

    endExecution : function () {
        console.log('Number of conditionals in file:' + Object.keys(branches).length);
        console.log('Number of "Return" hook was invoked:' + count['_return']);
	console.log('Number of all variables declared:' + count['declare']);        
	console.log('Number of all functions in file:' + count['declare_function']);
        console.log('Number of functions being called:' + count['invokeFun']);
        console.log('Number of variable was read:' + count['read']);
        console.log('Number of variable was written:' + count['write']);
    }
};

}());
