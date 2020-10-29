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
    throw Napi::Error::New(env, "argument must be an object typed as { email: string, password: string }");
  }

  return info.Env().Undefined();
}

Napi::Value NativeExecutorCommon::setWorkDir(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (!info[0].IsString()) {
    throw Napi::Error::New(env, "argument must be a string");
  }

  auto&& worgingDirectory = info[0].As<Napi::String>();

  this->_workingDir = worgingDirectory;

  return info.Env().Undefined();
}

Napi::Value NativeExecutorCommon::setWowName(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (!info[0].IsString()) {
    throw Napi::Error::New(env, "argument must be a string");
  }

  auto&& filename = info[0].As<Napi::String>();

  this->_wowFilename = filename;

  return info.Env().Undefined();
}

void NativeExecutorCommon::onChildExit(uv_process_t* req, int64_t exit_status, int term_signal) {
  uv_close((uv_handle_t*) req, NULL);
}