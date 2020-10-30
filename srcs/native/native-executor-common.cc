#include "./native-executor.h"

NativeExecutorCommon::NativeExecutorCommon(const Napi::CallbackInfo &info):
_env(info.Env()) {
  napi_get_uv_event_loop(info.Env(), &this->_main_loop);
}

Napi::Value NativeExecutorCommon::setAccount(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    auto&& account = info[0].As<Napi::Object>();

    this->_account = {
      account.Get("email").ToString(),
      account.Get("password").ToString()
    };
  } catch(std::exception &) {
    Napi::Error::New(env, "argument must be an object typed as { email: string, password: string }").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  return env.Undefined();
}

Napi::Value NativeExecutorCommon::setWorkDir(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (!info[0].IsString()) {
    Napi::Error::New(env, "argument must be a string").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  auto&& worgingDirectory = info[0].As<Napi::String>();

  this->_workingDir = worgingDirectory;

  return env.Undefined();
}

Napi::Value NativeExecutorCommon::setWowName(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (!info[0].IsString()) {
    Napi::Error::New(env, "argument must be a string").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  auto&& filename = info[0].As<Napi::String>();

  this->_wowFilename = filename;

  return env.Undefined();
}