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
  Napi::Value writeCredentials(const Napi::CallbackInfo &info);
};  

Napi::FunctionReference NativeExecutorForLinux::constructor;

DECLARE_INIT_FUNCTION(NativeExecutorForLinux);

Napi::Value NativeExecutorForLinux::waitForWoWReady(const Napi::CallbackInfo &info){
    Napi::Env env = info.Env();

    auto deferred = std::make_shared<Napi::Promise::Deferred>(info.Env());
    auto* timer = new pw::Timer(this->_main_loop);

    timer->start([this, env, deferred] (pw::Timer& timer) {
      
      Display *display = XOpenDisplay(0);

      pw::WindowsMatchingPid match(display, XDefaultRootWindow(display), this->_wowProc->getPid());

      if (match.result().size() == 3) {
        pw::Timer::once(this->_main_loop, [deferred, env] {
          deferred->Resolve(env.Undefined());
        }, 1000);
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

    try {

      this->_wowProc = std::make_unique<pw::Process>(
        this->_main_loop, this->_workingDir, "wine", std::vector<std::string>{ this->_wowFilename }
      );

      auto& options = _wowProc->getOptions();
      options.flags = UV_PROCESS_DETACHED;

      this->_wowProc->start();
      uv_unref((uv_handle_t*) &this->_wowProc->getHandle());

    } catch (const std::exception& e) {
      Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }

    return env.Undefined();
}

Napi::Value NativeExecutorForLinux::writeCredentials(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();



  return env.Undefined();
}


Napi::Object Init(Napi::Env env, Napi::Object exports) {
    NativeExecutorForLinux::Init(env, exports);
    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)