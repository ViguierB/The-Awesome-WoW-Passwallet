#include <napi.h>
#include <iostream>
#include <memory>
#include <list>
#include "./windows_matching_pid_linux.h"
#include "./native-executor.h"
#include "./timer.h"
#include "./fake-keyboard-linux.h"

class NativeExecutorForLinux : public NativeExecutorCommon, public Napi::ObjectWrap<NativeExecutorForLinux> {
public:
  static inline void Init(Napi::Env& env, Napi::Object& exports);
  NativeExecutorForLinux(const Napi::CallbackInfo &info):
  NativeExecutorCommon(info),
  Napi::ObjectWrap<NativeExecutorForLinux>(info) {
    std::cout << __FUNCTION__ << std::endl;
  }

  ~NativeExecutorForLinux() {
    XCloseDisplay(_display);
    std::cout << __FUNCTION__ << std::endl;
  }

private:
  Display*  _display = XOpenDisplay(0);
  Window    _wowWin = 0;

  static Napi::FunctionReference constructor;
  Napi::Value waitForWoWReady(const Napi::CallbackInfo &info);
  Napi::Value isWoWReady(const Napi::CallbackInfo &info);
  Napi::Value spawnWow(const Napi::CallbackInfo &info);
  Napi::Value writeCredentials(const Napi::CallbackInfo &info);
};  

Napi::FunctionReference NativeExecutorForLinux::constructor;

DECLARE_INIT_FUNCTION(NativeExecutorForLinux);

Napi::Value NativeExecutorForLinux::isWoWReady(const Napi::CallbackInfo &info){
  Napi::Env env = info.Env();

  pw::WindowsMatchingPid match(this->_display, XDefaultRootWindow(this->_display), this->_wowProc->getPid());

  if (match.result().size() == 3) {
    this->_wowWin = match.result().back();
    return Napi::Boolean::New(env, true);
  }
  return Napi::Boolean::New(env, false);
}

Napi::Value NativeExecutorForLinux::spawnWow(const Napi::CallbackInfo &info){
    Napi::Env env = info.Env();

    try {

      std::vector<std::string> args{ this->_wowFilename };

      if (this->_wowargs) {
        args.insert(args.end(), this->_wowargs->begin(), this->_wowargs->end());
      }

      this->_wowProc = std::make_unique<pw::Process>(
        this->_main_loop, this->_workingDir, "wine", args
      );

      if (this->_wowEnv) {
        this->_wowProc->setEnv(*this->_wowEnv);
      }

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
  Napi::Env             env = info.Env();
  pw::FakeKeyboardLinux fakeKb(this->_display, this->_wowWin);

  fakeKb.text(this->_account.email);
  fakeKb.sendTab();
  fakeKb.text(this->_account.password);
  fakeKb.sendReturn();

  return env.Undefined();
}


Napi::Object Init(Napi::Env env, Napi::Object exports) {
    NativeExecutorForLinux::Init(env, exports);
    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)