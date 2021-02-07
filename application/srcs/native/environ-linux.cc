extern char **environ;

namespace pw {

  char**  getFullEnv() {
    return environ;
  }

}