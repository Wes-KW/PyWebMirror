// worker.wrapper.js

const create_proxied_worker = function(_worker) {
    const worker = {};
    const extra_overwrite = [
        "self", "importScripts"
    ];

    create_proxied_web_object(_worker, extra_overwrite, worker);
}