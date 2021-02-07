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

static inline void split(std::vector<std::string>& res, std::string s, std::string delimiter) {
    size_t                    pos_start = 0,
                              pos_end,
                              delim_len = delimiter.length();
    std::string               token;

    while ((pos_end = s.find(delimiter, pos_start)) != std::string::npos) {
        token = s.substr(pos_start, pos_end - pos_start);
        pos_start = pos_end + delim_len;
        res.push_back(token);
    }

    res.push_back(s.substr(pos_start));
}

Napi::Value NativeExecutorCommon::setWowEnv(const Napi::CallbackInfo &info) {
  Napi::Env         env = info.Env();
  auto&             wenv = this->_wowEnv = std::make_unique<std::vector<std::string>>();

  if (!info[0].IsString()) {
    Napi::Error::New(env, "argument must be a string").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  std::string envStr = info[0].As<Napi::String>();

  split(*wenv, envStr, " ");

  return env.Undefined();
}

Napi::Value NativeExecutorCommon::setWowArgs(const Napi::CallbackInfo &info) {
  Napi::Env         env = info.Env();
  const std::string delimiter{" "};
  auto&             args = this->_wowargs = std::make_unique<std::vector<std::string>>();

  if (!info[0].IsString()) {
    Napi::Error::New(env, "argument must be a string").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  std::string argsStr = info[0].As<Napi::String>();

  split(*args, argsStr, " ");

  return env.Undefined();
}