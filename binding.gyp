{
  "targets": [
    {
      "target_name": "native_executor",
      "sources": [
        "srcs/native/native-executor-common.cc",
      ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "defines": [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
      'conditions': [
        [ 'OS in "linux freebsd openbsd solaris android aix cloudabi"', {
          'cflags': ['-Wno-cast-function-type'],
        }],
        ['OS not in ["mac", "win"]', {
          'sources': [
            'srcs/native/native-executor-linux.cc',
          ],
          'cflags': [
            '<!(pkg-config --cflags x11)',
            '-Wno-missing-field-initializers',
            '-Wno-deprecated-declarations',
          ],
          'link_settings': {
            'ldflags': [
              '<!(pkg-config --libs-only-L --libs-only-other x11)',
              '-lxdo'
            ],
            'libraries': [
              '<!(pkg-config --libs-only-l x11)',
              '-lxdo'
            ],
          },
        }]
      ],
    }
  ]
}