defmodule PhoenixDappWeb.RetailerLive do
  use PhoenixDappWeb, :live_view
  on_mount {PhoenixDappWeb.GlobalSettingsHook, :default}

  @stable_tokens [
    %{name: "USDC", address: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", symbol: "USDC"},
    %{name: "USDT", address: "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS", symbol: "USDT"},
    %{name: "DAI", address: "EjmyN6qEC1Tf1JxiG1ae7UTJhUxSwk1TCWNWqxWV4J6o", symbol: "DAI"},
    %{name: "PYUSD", address: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo", symbol: "PYUSD"}
  ]

  def mount(_params, _session, socket) do
    {:ok, assign(socket,
      page_title: "Retailer Dashboard",
      account_created: false,
      selected_mint: nil,
      stable_tokens: @stable_tokens,
      # UI state
      dark_mode: false,
      locale: "en",
      active_tab: "account"

    )}
  end
  def handle_event("toggle_dark_mode", _params, socket) do
    {:noreply, assign(socket, dark_mode: !socket.assigns.dark_mode)}
  end

  def handle_event("change_locale", %{"locale" => locale}, socket) do
    {:noreply, assign(socket, locale: locale)}
  end

  def handle_event("change_locale", %{"locale" => _locale}, socket) do

    {:noreply, socket}
  end

  def handle_event("switch_tab", %{"tab" => tab}, socket) do
    {:noreply, assign(socket, active_tab: tab)}
  end

  def handle_event("select_mint", %{"mint" => mint_address}, socket) do
    selected_mint = Enum.find(socket.assigns.stable_tokens, &(&1.address == mint_address))
    {:noreply, assign(socket, selected_mint: selected_mint)}
  end

  def render(assigns) do
      ~H"""
       <div class="min-h-screen">
         <div class="container mx-auto px-4 py-6">
           <!-- Tabs -->
           <div class="mb-6">
             <nav class="flex space-x-1">
               <button 
                 phx-click="switch_tab" 
                 phx-value-tab="account"
                 class={[
                   "px-4 py-2 rounded-lg font-medium transition-colors duration-200",
                   if(@active_tab == "account",
                     do: if(@dark_mode, do: "bg-blue-600 text-white", else: "bg-blue-500 text-white"),
                     else: if(@dark_mode, do: "bg-gray-700 text-gray-300 hover:bg-gray-600", else: "bg-gray-200 text-gray-700 hover:bg-gray-300")
                   )
                 ]}
               >
                 Account Setup
               </button>
               
               <button 
                 phx-click="switch_tab" 
                 phx-value-tab="add_item"
                 class={[
                   "px-4 py-2 rounded-lg font-medium transition-colors duration-200",
                   if(@active_tab == "add_item",
                     do: if(@dark_mode, do: "bg-blue-600 text-white", else: "bg-blue-500 text-white"),
                     else: if(@dark_mode, do: "bg-gray-700 text-gray-300 hover:bg-gray-600", else: "bg-gray-200 text-gray-700 hover:bg-gray-300")
                   )
                 ]}
               >
                 Add Item
               </button>
             </nav>
           </div>

           <!-- Account Tab -->
           <div class={["#{if @active_tab != "account", do: "hidden"}"]}>
             <div class={if(@dark_mode, do: "bg-gray-800 text-white", else: "bg-white text-gray-900") <> " rounded-lg p-6 shadow-md"}>
               <h2 class="text-xl font-semibold mb-4">Create Retailer Account</h2>
               
               <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                 <%= for token <- @stable_tokens do %>
                   <button 
                     phx-click="select_mint"
                     phx-value-mint={token.address}
                     class={[
                       "p-4 rounded-lg border transition-colors duration-200",
                       if(@selected_mint && @selected_mint.address == token.address,
                         do: if(@dark_mode, do: "bg-blue-600 border-blue-500 text-white", else: "bg-blue-500 border-blue-400 text-white"),
                         else: if(@dark_mode, do: "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600", else: "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100")
                       )
                     ]}
                   >
                     <div class="font-medium"><%= token.name %></div>
                     <div class="text-sm opacity-75"><%= token.symbol %></div>
                   </button>
                 <% end %>
               </div>
               
               <button class={if(@dark_mode, do: "bg-blue-600 hover:bg-blue-700", else: "bg-blue-500 hover:bg-blue-600") <> " px-6 py-3 text-white rounded-lg"}>
                 Create Account
               </button>
             </div>
           </div>

           <!-- Add Item Tab -->
           <div class={["#{if @active_tab != "add_item", do: "hidden"}"]}>
             <div class={if(@dark_mode, do: "bg-gray-800 text-white", else: "bg-white text-gray-900") <> " rounded-lg p-6 shadow-md"}>
               <h2 class="text-xl font-semibold mb-4">Add New Item</h2>
               
               <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div>
                   <label class="block text-sm font-medium mb-2">Item Name</label>
                   <input 
                     type="text"
                     class={if(@dark_mode, do: "bg-gray-700 border-gray-600 text-white", else: "bg-white border-gray-300 text-gray-900") <> " w-full px-3 py-2 border rounded-md focus:border-blue-500"}
                   />
                 </div>
                 
                 <div>
                   <label class="block text-sm font-medium mb-2">Price</label>
                   <input 
                     type="number"
                     class={if(@dark_mode, do: "bg-gray-700 border-gray-600 text-white", else: "bg-white border-gray-300 text-gray-900") <> " w-full px-3 py-2 border rounded-md focus:border-blue-500"}
                   />
                 </div>

                 <div>
                   <label class="block text-sm font-medium mb-2">Quantity</label>
                   <input 
                     type="number"
                     class={if(@dark_mode, do: "bg-gray-700 border-gray-600 text-white", else: "bg-white border-gray-300 text-gray-900") <> " w-full px-3 py-2 border rounded-md focus:border-blue-500"}
                   />
                 </div>

                 <div>
                   <label class="block text-sm font-medium mb-2">Expiry Date</label>
                   <input 
                     type="datetime-local"
                     class={if(@dark_mode, do: "bg-gray-700 border-gray-600 text-white", else: "bg-white border-gray-300 text-gray-900") <> " w-full px-3 py-2 border rounded-md focus:border-blue-500"}
                   />
                 </div>
               </div>

               <div class="mb-6">
                 <label class="block text-sm font-medium mb-2">Description</label>
                 <textarea 
                   rows="4"
                   class={if(@dark_mode, do: "bg-gray-700 border-gray-600 text-white", else: "bg-white border-gray-300 text-gray-900") <> " w-full px-3 py-2 border rounded-md focus:border-blue-500"}
                 ></textarea>
               </div>
               
               <button class={if(@dark_mode, do: "bg-green-600 hover:bg-green-700", else: "bg-green-500 hover:bg-green-600") <> " px-6 py-3 text-white rounded-lg"}>
                 Add Item
               </button>
             </div>
           </div>
         </div>
       </div>
    """
  end
end
