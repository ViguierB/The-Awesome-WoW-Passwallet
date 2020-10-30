#if !defined(__PROCESS_H__)
#define __PROCESS_H__

#include <uv.h>
#include <stdexcept>
#include <vector>
#include <algorithm>

namespace pw {

class Process {
private:
  uv_loop_t*                _mainLoop;
  uv_process_t*             _child_req;
  uv_process_options_t      _options = {0};
  std::vector<std::string>  _arguments;
  std::string               _workingDirectory;

  static void _onChildExit(uv_process_t* req, int64_t exit_status, int term_signal) {
    uv_close((uv_handle_t*) req, [] (uv_handle_t* h) { delete h; });
  }

public:
  Process(
    uv_loop_t* loop, std::string const& workingDirectory,
    std::string const& executable, std::vector<std::string>&& args
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

  auto getPid() {
    return this->getHandle().pid;
  }

  int start() {
    std::vector<const char*> args(_arguments.size() + 1);
    std::transform(_arguments.begin(), _arguments.end(), args.begin(), [] (std::string& arg) -> const char* {
      return arg.c_str();
    });
    args.push_back(nullptr);

    this->_child_req = new uv_process_t({0});
    this->_child_req->data = this;
    this->_options.exit_cb = &Process::_onChildExit;
    this->_options.args = (char**)args.data();
    this->_options.file = args.data()[0];
    this->_options.cwd = this->_workingDirectory.c_str();

    int r;
    if ((r = uv_spawn(this->_mainLoop, this->_child_req, &this->_options))) {
      throw std::runtime_error(uv_strerror(r));
    } else {
      fprintf(stdout, "Launched process with ID %d\n", this->_child_req->pid);
    }

    return r;
  }
};
 
} // namespace pw


#endif // __PROCESS_H__
