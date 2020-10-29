#if !defined(__NATIVE_EXECUTOR_H__)
#define __NATIVE_EXECUTOR_H__

#include <uv.h>
#include <napi.h>

class NativeExecutorCommon {
public:
  NativeExecutorCommon(const Napi::CallbackInfo &info);

protected:
  struct uv_loop_s* _main_loop;
  struct {
    std::string email;
    std::string password;
  }           _account;
  std::string _workingDir;
  std::string _wowFilename;

  Napi::Env               _env;

  uv_process_t          _child_req;
  uv_process_options_t  _options = {0};

  static void onChildExit(uv_process_t* req, int64_t exit_status, int term_signal);

  Napi::Value setAccount(const Napi::CallbackInfo &info);
  Napi::Value setWorkDir(const Napi::CallbackInfo &info);
  Napi::Value setWowName(const Napi::CallbackInfo &info);
};

#define DECLARE_INIT_FUNCTION(T) \
Napi::Object T::Init(Napi::Env env, Napi::Object exports) { \
    /* This method is used to hook the accessor and method callbacks */ \
    Napi::Function func = T::DefineClass(env, "NativeExecutor", { \
      T::InstanceMethod("spawnWow", &T::spawnWow), \
      T::InstanceMethod("waitForWoWReady", &T::waitForWoWReady), \
      T::InstanceMethod("setAccount", &T::setAccount), \
      T::InstanceMethod("setWorkDir", &T::setWorkDir), \
      T::InstanceMethod("setWowName", &T::setWowName), \
    }); \
    /* Create a peristent reference to the class constructor. This will allow */ \
    /* a function called on a class prototype and a function */ \
    /* called on instance of a class to be distinguished from each other. */\
    T::constructor = Napi::Persistent(func); \
    /* Call the SuppressDestruct() method on the static data prevent the calling */ \
    /* to this destructor to reset the reference when the environment is no longer */ \
    /* available. */ \
    T::constructor.SuppressDestruct(); \
    exports.Set("NativeExecutor", func); \
    return exports; \
}

#endif // __NATIVE_EXECUTOR_H__
