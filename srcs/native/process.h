#if !defined(__PROCESS_H__)
#define __PROCESS_H__

#include <uv.h>
#include <stdexcept>
#include <vector>
#include <algorithm>
#include <unistd.h>

// #if !defined(__PW_ENVIRON__)
// #define __PW_ENVIRON__

// extern char **environ;

// #endif

namespace pw {

class Process {
private:
  uv_loop_t*                _mainLoop;
  uv_process_t*             _child_req;
  uv_process_options_t      _options = {0};
  std::vector<std::string>  _arguments;
  std::vector<std::string>  _environ;
  std::string               _workingDirectory;

  static void _onChildExit(uv_process_t* req, int64_t exit_status, int term_signal) {
    uv_close((uv_handle_t*) req, [] (uv_handle_t* h) { delete h; });
  }

public:
  Process(
    uv_loop_t* loop, std::string const& workingDirectory,
    std::string const& executable, std::vector<std::string>const& args
  ): _mainLoop(loop), _arguments({ executable }), _workingDirectory(workingDirectory) {
    _arguments.insert(_arguments.end(), args.begin(), args.end());
  }

  auto& getOptions() { return this->_options; }
  auto& getHandle() {
    if (!!this->_child_req) {
      return *this->_child_req;
    } else {
      throw std::runtime_error("No process started");
    }
  }

  void setEnv(std::vector<std::string>& env) {
    this->_environ.insert(this->_environ.end(), env.begin(), env.end());
  }

  auto getPid() {
    return this->getHandle().pid;
  }

  void start() {
    std::vector<const char*> args(_arguments.size() + 1);
    std::vector<const char*> env{};
    std::transform(_arguments.begin(), _arguments.end(), args.begin(), [] (std::string& arg) -> const char* {
      return arg.c_str();
    });
    args.push_back(nullptr);

    if (this->_environ.size() > 0) {
      for (auto **ePtr = ::environ; *ePtr != nullptr; ++ePtr) {
        env.push_back(*ePtr);
      }

      std::transform(_environ.begin(), _environ.end(), env.begin(), [] (std::string& ev) -> const char* {
        return ev.c_str();
      });
      env.push_back(nullptr);

      this->_options.env = (char**)env.data();
    }

    this->_child_req = new uv_process_t({0});
    this->_child_req->data = this;
    this->_options.exit_cb = &Process::_onChildExit;
    this->_options.args = (char**)args.data();
    this->_options.file = args.data()[0];
    this->_options.cwd = this->_workingDirectory.c_str();

    int r;
    if ((r = uv_spawn(this->_mainLoop, this->_child_req, &this->_options))) {
      throw std::runtime_error(uv_strerror(r));
    }
  }
};
 
} // namespace pw


#endif // __PROCESS_H__
