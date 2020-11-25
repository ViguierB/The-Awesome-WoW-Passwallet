#if !defined(__FAKE_KEYBOARD_WINDOWS_H__)
#define __FAKE_KEYBOARD_WINDOWS_H__

#include <windows.h>

namespace pw {

class FakeKeyboardWindows {
private:
  HWND  _win;

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
    if (data.processId != processId || !FakeKeyboardWindows::isMainWindow(handle)) {
      return TRUE;
    }
    data.windowHandle = handle;
    return FALSE;   
  }

public:
  FakeKeyboardWindows(int pid) {
    handleData  data;

    data.processId = pid;
    data.windowHandle = 0;
    ::EnumWindows(&FakeKeyboardWindows::enumWindowsCallback, (LPARAM)&data);

    if (data.windowHandle == 0) {
      throw std::runtime_error("cannot find main window");
    }
    this->_win = data.windowHandle;
  }

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
