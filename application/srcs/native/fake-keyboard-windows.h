#if !defined(__FAKE_KEYBOARD_WINDOWS_H__)
#define __FAKE_KEYBOARD_WINDOWS_H__

#include <windows.h>

namespace pw {

class FakeKeyboardWindows {
private:
  HWND  _win;
public:
  FakeKeyboardWindows(int pid, HWND win): _win(win) {}

  void sendTab() { 
    std::vector<INPUT> inputs;
    INPUT input = { 0 };
    input.type = INPUT_KEYBOARD;
    input.ki.dwFlags = 0;
    input.ki.wVk = VK_TAB;
    inputs.push_back(input);

    input.ki.dwFlags |= KEYEVENTF_KEYUP;
    inputs.push_back(input);

    ::SetForegroundWindow(this->_win);

    ::SendInput(inputs.size(), inputs.data(), sizeof(INPUT));
  }

  void sendReturn() { 
    std::vector<INPUT> inputs;
    INPUT input = { 0 };
    input.type = INPUT_KEYBOARD;
    input.ki.dwFlags = 0;
    input.ki.wVk = VK_RETURN;
    inputs.push_back(input);

    input.ki.dwFlags |= KEYEVENTF_KEYUP;
    inputs.push_back(input);

    ::SetForegroundWindow(this->_win);

    ::SendInput(inputs.size(), inputs.data(), sizeof(INPUT));
  }

  void text(std::string const& text) {
    std::vector<INPUT> inputs;
    for(auto ch : text) {
      INPUT input = { 0 };
      input.type = INPUT_KEYBOARD;
      input.ki.dwFlags = KEYEVENTF_UNICODE;
      input.ki.wScan = ch;
      inputs.push_back(input);

      input.ki.dwFlags |= KEYEVENTF_KEYUP;
      inputs.push_back(input);
    }

    ::SetForegroundWindow(this->_win);

    ::SendInput(inputs.size(), inputs.data(), sizeof(INPUT));
  }

};

}

#endif // __FAKE_KEYBOARD_WINDOWS_H__
