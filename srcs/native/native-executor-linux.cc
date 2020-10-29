#include <napi.h>
#include <iostream>
#include <memory>
#include <list>
#include "./windows_matching_pid_linux.h"
#include "./native-executor.h"
#include "./timer.h"

extern "C" {
  #include <xdo.h>
  #include <X11/Xlib.h>
  #include <X11/Xatom.h>
  #include <X11/keysym.h>
}

class NativeExecutorForLinux : public NativeExecutorCommon, public Napi::ObjectWrap<NativeExecutorForLinux> {
public:
  static inline Napi::Object Init(Napi::Env env, Napi::Object exports);
  NativeExecutorForLinux(const Napi::CallbackInfo &info):
    NativeExecutorCommon(info),
    Napi::ObjectWrap<NativeExecutorForLinux>(info) {}

  ~NativeExecutorForLinux() {
    std::cout << "~NativeExecutorForLinux()" << std::endl;
    if (!!this->_options.args) {
      free(this->_options.args);
    }
  }

private:
  // xdo_t *x = xdo_new(NULL);

  static Napi::FunctionReference constructor;
  Napi::Value waitForWoWReady(const Napi::CallbackInfo &info);
  Napi::Value spawnWow(const Napi::CallbackInfo &info);
};  

Napi::FunctionReference NativeExecutorForLinux::constructor;

DECLARE_INIT_FUNCTION(NativeExecutorForLinux);

Napi::Value NativeExecutorForLinux::waitForWoWReady(const Napi::CallbackInfo &info){
    Napi::Env env = info.Env();

    auto deferred = std::make_shared<Napi::Promise::Deferred>(info.Env());
    auto* timer = new pw::Timer(this->_main_loop);

    timer->start([this, env, deferred] (pw::Timer& timer) {
      
      Display *display = XOpenDisplay(0);

      pw::WindowsMatchingPid match(display, XDefaultRootWindow(display), this->_child_req.pid);

      if (match.result().size() == 3) {
        deferred->Resolve(env.Undefined());
        timer.deleteLater();
      } else if (timer.getCount() >= 15) {
        deferred->Reject(Napi::String::New(env, "Unable to find WoW window"));
        timer.deleteLater();
      }
    }, { 1000, 1000 });

    return deferred->Promise();
}

Napi::Value NativeExecutorForLinux::spawnWow(const Napi::CallbackInfo &info){
    Napi::Env env = info.Env();

    this->_options.file = (const char*)"wine";
    this->_options.cwd = this->_workingDir.c_str();
    this->_options.exit_cb = &NativeExecutorCommon::onChildExit;
    this->_options.flags = UV_PROCESS_DETACHED;
    this->_options.args = (char**)malloc(sizeof(char*) * 3);
    this->_options.args[0] = (char*)"wine";
    this->_options.args[1] = (char*)this->_wowFilename.c_str();
    this->_options.args[2] = NULL;
    this->_child_req.data = this;
 
    int r;
    if ((r = uv_spawn(this->_main_loop, &this->_child_req, &this->_options))) {
      throw Napi::Error::New(info.Env(), uv_strerror(r));
    } else {
      fprintf(stdout, "Launched process with ID %d\n", this->_child_req.pid);
      uv_unref((uv_handle_t*) &this->_child_req);
    }

    return env.Undefined();
}


Napi::Object Init(Napi::Env env, Napi::Object exports) {
    NativeExecutorForLinux::Init(env, exports);
    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)