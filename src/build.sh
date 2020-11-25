em++ --bind -O3 -s WASM=1 -s NO_FILESYSTEM=1 \
    -s "EXTRA_EXPORTED_RUNTIME_METHODS=['cwrap']" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s "EXPORT_NAME='MyColorSpace'" \
    --pre-js ./pre.js \
    -o ./colorspace.js \
    colorspace.cpp GenColor.cpp
