#if !defined(__WINDOWS_MATCHING_PID_LINUX_H__)
#define __WINDOWS_MATCHING_PID_LINUX_H__


#include <iostream>
#include <memory>
#include <list>

extern "C" {
  #include <X11/Xlib.h>
  #include <X11/Xatom.h>
}

// source: https://www.itread01.com/p/1375556.html

namespace pw {

class WindowsMatchingPid
{
public:
  WindowsMatchingPid(Display *display, Window wRoot, unsigned long pid)
    : _display(display)
    , _pid(pid)
  {
  // Get the PID property atom.
    _atomPID = XInternAtom(display, "_NET_WM_PID", True);
    if(_atomPID == None)
    {
      std::cout << "No such atom" << std::endl;
      return;
    }

    search(wRoot);
  }

  const std::list<Window> &result() const { return _result; }

private:
  Atom                _atomPID;
  Display*            _display;
  unsigned long       _pid;
  std::list<Window>   _result;

  void search(Window w)
  {
  // Get the PID for the current Window.
    Atom           type;
    int            format;
    unsigned long  nItems;
    unsigned long  bytesAfter;
    unsigned char *propPID = 0;
    if(Success == XGetWindowProperty(_display, w, _atomPID, 0, 1, False, XA_CARDINAL,
                                      &type, &format, &nItems, &bytesAfter, &propPID))
    {
      if(propPID != 0)
      {
      // If the PID matches, add this window to the result set.
        if(_pid == *((unsigned long *)propPID))
          _result.push_back(w);

        XFree(propPID);
      }
    }

  // Recurse into child windows.
    Window    wRoot;
    Window    wParent;
    Window   *wChild;
    unsigned  nChildren;
    if(0 != XQueryTree(_display, w, &wRoot, &wParent, &wChild, &nChildren))
    {
      for(unsigned i = 0; i < nChildren; i++)
        search(wChild[i]);
    }
  }
};

}

#endif // __WINDOWS_MATCHING_PID_LINUX_H__