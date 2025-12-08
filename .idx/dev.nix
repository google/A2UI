{ pkgs, ... }: {
  env = {
    PORT = "4200";
  };

# Enable previews and customize configuration
  idx.previews = {
    enable = true;
    previews = {
      # The following object sets web previews
      web = {
        command = [
          "npm"
          "start"
          "--"
          "orchestrator"
          "--port"
          "$PORT"
          "--host"
          "localhost"
        ];
        manager = "web";
        cwd="samples/client/angular";
        # Optionally, specify a directory that contains your web app
        # cwd = "app/client";
      };
    };
  };
}