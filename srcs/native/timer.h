#if !defined(__TIMER_H__)
#define __TIMER_H__

#include <uv.h>
#include <functional>

namespace pw {

class Timer {
private:
  uv_loop_t*    _mainLoop;
  bool          _isStart = false;
  std::uint32_t _counter = 0; 
  
  uv_timer_t _handle = {0};

  std::function<void (Timer&)> _handler = nullptr;

  static void _bind(uv_timer_t* handle) {
    ++reinterpret_cast<Timer*>(handle->data)->_counter;
    reinterpret_cast<Timer*>(handle->data)->_handler(
      *reinterpret_cast<Timer*>(handle->data)
    );
  }

  static void _deleteLaterCallBack(uv_handle_t* handle) {
    auto* t = reinterpret_cast<Timer*>(handle->data);

    delete t;
  }

public:

  struct Options {
    uint64_t  timeout;
    uint64_t  repeat;
  };

  Timer(uv_loop_t* mainLoop):
  _mainLoop(mainLoop) {
    uv_timer_init(this->_mainLoop, &this->_handle);
    _handle.data = this;
  }

  ~Timer() = default;

  auto& getNativeHandle() { return this->_handle; }

  void start(decltype(Timer::_handler) const&& func, Timer::Options&& options) {
    if (this->_isStart) { return; }
    this->_handler = func;
    uv_timer_start(&this->_handle, (uv_timer_cb)&Timer::_bind,
      options.timeout, options.repeat);
    this->_isStart = true;
  }

  void stop() {
    if (this->_isStart) {
      uv_timer_stop(&this->_handle);
    }
  }

  void deleteLater() {
    this->stop();
    uv_close((uv_handle_t*)&this->_handle, (uv_close_cb) &Timer::_deleteLaterCallBack);
  }

  auto getCount() { return this->_counter; }
};

}


#endif // __TIMER_H__
