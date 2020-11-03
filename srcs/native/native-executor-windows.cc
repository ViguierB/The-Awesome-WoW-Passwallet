#include <napi.h>
#include <iostream>
#include <memory>
#include <list>
#include "./process.h"
#include "./native-executor.h"

class NativeExecutorForWindows : public NativeExecutorCommon, public Napi::ObjectWrap<NativeExecutorForWindows> {
public:
  static inline Napi::Object Init(Napi::Env env, Napi::Object exports);
  NativeExecutorForWindows(const Napi::CallbackInfo &info):
  NativeExecutorCommon(info),
  Napi::ObjectWrap<NativeExecutorForWindows>(info) {
    std::cout << "NativeExecutorForWindows()" << std::endl;
  }

  ~NativeExecutorForWindows() {
    std::cout << "~NativeExecutorForWindows()" << std::endl;
  }

private:

  static Napi::FunctionReference constructor;
  Napi::Value waitForWoWReady(const Napi::CallbackInfo &info);
  Napi::Value isWoWReady(const Napi::CallbackInfo &info);
  Napi::Value spawnWow(const Napi::CallbackInfo &info);
  Napi::Value writeCredentials(const Napi::CallbackInfo &info);
};  

Napi::FunctionReference NativeExecutorForWindows::constructor;

DECLARE_INIT_FUNCTION(NativeExecutorForWindows);

Napi::Value NativeExecutorForWindows::isWoWReady(const Napi::CallbackInfo &info){
  Napi::Env env = info.Env();

  return env.Undefined();
}

Napi::Value NativeExecutorForWindows::spawnWow(const Napi::CallbackInfo &info){
  Napi::Env env = info.Env();

    try {

      this->_wowProc = std::make_unique<pw::Process>(
        this->_main_loop, this->_workingDir, this->_wowFilename, std::vector<std::string>{}
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

Napi::Value NativeExecutorForWindows::writeCredentials(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  return env.Undefined();
}


Napi::Object Init(Napi::Env env, Napi::Object exports) {
    NativeExecutorForWindows::Init(env, exports);
    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)