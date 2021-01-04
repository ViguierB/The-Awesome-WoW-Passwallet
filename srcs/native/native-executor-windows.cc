#include <napi.h>
#include <iostream>
#include <memory>
#include <list>
#include "./process.h"
#include "./native-executor.h"
#include "./fake-keyboard-windows.h"

class NativeExecutorForWindows : public NativeExecutorCommon, public Napi::ObjectWrap<NativeExecutorForWindows> {
public:
  static inline void  Init(Napi::Env& env, Napi::Object& exports);
  NativeExecutorForWindows(const Napi::CallbackInfo &info):
  NativeExecutorCommon(info),
  Napi::ObjectWrap<NativeExecutorForWindows>(info) {
    std::cout << "NativeExecutorForWindows()" << std::endl;
  }

  ~NativeExecutorForWindows() {
    std::cout << "~NativeExecutorForWindows()" << std::endl;
  }

private:
  HANDLE  _pNativeHandle;
  HWND    _pMainWin;

  struct handleData {
    unsigned long processId;
    HWND          windowHandle;
  };

  static BOOL isMainWindow(HWND handle) {
    return ::GetWindow(handle, GW_OWNER) == (HWND)0 && ::IsWindowVisible(handle);
  }

  static BOOL CALLBACK enumWindowsCallback(HWND handle, LPARAM lParam) {
    auto&         data = *(handleData*)lParam;
    unsigned long processId = 0;

    ::GetWindowThreadProcessId(handle, &processId);
    if (data.processId != processId || !NativeExecutorForWindows::isMainWindow(handle)) {
      return TRUE;
    }
    data.windowHandle = handle;
    return FALSE;   
  }

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

  auto res = WaitForInputIdle(this->_pNativeHandle, 100);

  switch (res) {
    case 0: {
      handleData  data;

      data.processId = this->_wowProc->getPid();
      data.windowHandle = 0;
      ::EnumWindows(&NativeExecutorForWindows::enumWindowsCallback, (LPARAM)&data);

      if (data.windowHandle == 0) {
        return Napi::Boolean::New(env, false);
      }

      this->_pMainWin = data.windowHandle;
      return Napi::Boolean::New(env, true);
    }
    case WAIT_TIMEOUT: return Napi::Boolean::New(env, false);
    case WAIT_FAILED: {
      Napi::Error::New(env, "Error: WaitForInputIdle()").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    default: {
      Napi::Error::New(env, "Error: WaitForInputIdle(): unknow error").ThrowAsJavaScriptException();
      return env.Undefined();
    }
  }
}

Napi::Value NativeExecutorForWindows::spawnWow(const Napi::CallbackInfo &info){
  Napi::Env env = info.Env();

  try {

    this->_wowProc = std::make_unique<pw::Process>(
      this->_main_loop, this->_workingDir, this->_wowFilename,
      (this->_wowargs ? *this->_wowargs : std::vector<std::string>{})
    );

    if (this->_wowEnv) {
      this->_wowProc->setEnv(*this->_wowEnv);
    }

    auto& options = _wowProc->getOptions();
    options.flags = UV_PROCESS_DETACHED;

    this->_wowProc->start();
    uv_unref((uv_handle_t*) &this->_wowProc->getHandle());

    this->_pNativeHandle = ::OpenProcess(PROCESS_ALL_ACCESS, TRUE, this->_wowProc->getPid());

  } catch (const std::exception& e) {
    Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
  }

  return env.Undefined();
}

Napi::Value NativeExecutorForWindows::writeCredentials(const Napi::CallbackInfo &info) {
  Napi::Env   env = info.Env();
  
  try {
    pw::FakeKeyboardWindows fk(this->_wowProc->getPid(), this->_pMainWin);

    fk.text(this->_account.email);
    fk.sendTab();
    fk.text(this->_account.password);
    fk.sendReturn();

  } catch (const std::exception& e) {
    Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
  }

  return env.Undefined();
}


Napi::Object Init(Napi::Env env, Napi::Object exports) {
    NativeExecutorForWindows::Init(env, exports);
    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)