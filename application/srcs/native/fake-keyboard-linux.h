#if !defined(__FAKE_KEYBOARD_LINUX_H__)
#define __FAKE_KEYBOARD_LINUX_H__

#include <ctime>
extern "C" {
  #include <X11/Xlib.h>
  #include <X11/Xatom.h>
  #include <X11/keysym.h>
  #include <xdo.h>
}
#include "./timer.h"

namespace pw {

class FakeKeyboardLinux {
private:
  Display*    _display;
  Window      _win;
  xdo_t*      _xdo;

public:
  FakeKeyboardLinux(Display* display, Window win):
  _display(display), _win(win),
  _xdo(xdo_new_with_opened_display(display, nullptr, false)) {
    this->_xdo->close_display_when_freed = 0;
  }

  ~FakeKeyboardLinux() {
    xdo_free(_xdo);
  }

  void sendTab() { 
    xdo_send_keysequence_window(this->_xdo, this->_win, "Tab", 120000);
  }

  void sendReturn() { 
    xdo_send_keysequence_window(this->_xdo, this->_win, "Return", 120000);
  }

  void text(std::string const& text) {
    xdo_enter_text_window(this->_xdo, this->_win, text.c_str(), 120000);
  }

};

}

#endif // __FAKE_KEYBOARD_LINUX_H__
