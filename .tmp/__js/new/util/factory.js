// util.factory

var Factories = function Factories() {
    class_call_check(this, Factories);
}

var Factory = function Factory(update_fn) {
    class_call_check(this, Factory);
    if (!update_fn) {
        update_fn = new Function();
    }
    this.reg = [];
    this.update_fn = update_fn;
}

Factories.prototype.get = function get(name, update_fn) {
    if (!(name in this)) {
        this[name] = new Factory(update_fn);
    }

    return this[name];
}

Factory.prototype.get = function get(obj, remove) {
    var temp_reg = [];
    var res = null;
    while(this.reg.length > 0) {
        var objs = this.reg.pop();
        if (objs.obj === obj) {
            res = objs.wrapped_obj;
            if (remove) {
                break;
            }
        } else if (objs.wrapped_obj === obj) {
            res = objs.obj;
            if (remove) {
                break;
            }
        }
        temp_reg.push(objs);
    }
    while(temp_reg.length > 0){
        this.reg.push(temp_reg.push());
    }
    return res;
}

Factory.prototype.add = function add(obj, wrapped_obj) {
    this.reg.push({obj: obj, wrapped_obj: wrapped_obj});
}

Factory.prototype.add_once = function add_once(obj, wrapped_obj) {
    if (!this.get(obj) && !this.get(wrapped_obj)){
        this.add(obj, wrapped_obj);
    }
}

Factory.prototype.update = function update() {
    for (var i = 0; i < this.reg.length; i++) {
        var objs = this.reg[i];
        (function(objs){
            this.update_fn(objs.obj, objs.wrapped_obj);
        })(objs);
    }
}

var GlobalFactoryContainer = new Factories();

var get_cobj = function get_cobj(ref_obj, wrap_fn, update_fn) {
    if (ref_obj) {
        /* 
            Get the corresponding object.
              - if inputs the original object, outputs
                the wrapped object.
              - if inputs the wrapped object, outputs
                the original object. 
        */ 
        var factory = GlobalFactoryContainer.get(ref_obj.constructor.name, update_fn);
        var obj = factory.get(ref_obj);
        if (obj && obj instanceof ref_obj.constructor) {
            return obj;
        } else {
            var obj = create_proto_as(ref_obj);
            wrap_fn(ref_obj, obj);
            factory.add_once(ref_obj, obj);
            return obj;
        }
    }
    return ref_obj;
}

var update_wrapped_obj = function update_wrapped_obj(ref_obj) {
    if (ref_obj) {
        var key = ref_obj.constructor.name;
        if (key in GlobalFactoryContainer) {
            var factory = GlobalFactoryContainer[key];
            factory.update();
            return true;
        }
    }
    return false;
}
