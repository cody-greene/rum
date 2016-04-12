# v2.0.1

Instead of adding the reloader client as an entry file, `require("rum")` is prepended to an existing entry file. This means top-level browserify transforms should no longer be applied to `node_modules`, speeding up the initial build, and avoiding any bugs related to transforms running on unexpected files.
