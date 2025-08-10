defmodule PhoenixDappWeb.GlobalSettingsHook do

  use Phoenix.LiveView

  def on_mount(:default, _params, _session, socket) do
    socket = assign(socket,

      locale: "en",
      dark_mode: false 
    )
    
    {:cont, socket}
  end
end

# Usage in your LiveView modules:
# 
# defmodule PhoenixDappWeb.AdminLive do
#   use PhoenixDappWeb, :live_view

#   

#   on_mount {PhoenixDappWeb.GlobalSettingsHook, :default}

#   

#   def handle_info(msg, socket) do
#     PhoenixDappWeb.GlobalSettingsHook.handle_global_settings_info(msg, socket)
#   end
#   
#   # ... rest of your LiveView
# end
