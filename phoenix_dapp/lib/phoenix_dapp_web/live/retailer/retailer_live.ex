defmodule PhoenixDappWeb.RetailerLive do
  use PhoenixDappWeb, :live_view
  on_mount {PhoenixDappWeb.GlobalSettingsHook, :default}

  defp t(key) do
    # Placeholder for translation function
    case key do
      "admin.title" -> "Admin Dashboard"
      "admin.config.tab" -> "Configuration"

      "admin.mint.tab" -> "Payment Methods"
      "admin.config.title" -> "Initialize Config"

      "admin.config.fee_label" -> "Fee Percentage (%)"
      "admin.config.button" -> "Initialize Config"
      "admin.config.success" -> "Configuration initialized successfully!"
      "admin.mint.title" -> "Payment Method Management"
      "admin.mint.stable_tokens" -> "Stable Tokens"
      "admin.mint.custom_mint" -> "Custom Mint Address"
      "admin.mint.add_stable" -> "Add Stable Token"
      "admin.mint.add_custom" -> "Add Custom Mint"
      "admin.mint.whitelisted" -> "Whitelisted Mints"
      "admin.mint.success" -> "Mint added successfully!"
      "admin.mint.select_token_error" -> "Please select a stable token first"
      "admin.mint.invalid_address_error" -> "Please enter a valid mint address"
      "admin.mint.remove" -> "Remove"
      "admin.mint.no_mints" -> "No whitelisted mints yet"
      # "admin.ui.dark_mode" -> "Dark Mode"
      # "admin.ui.language" -> "Language"
      _ -> key
    end

  end



  @stable_tokens [
    %{name: "USDC", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC"},
    %{name: "USDT", address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", symbol: "USDT"},
    %{name: "DAI", address: "EjmyN6qEC1Tf1JxiG1ae7UTJhUxSwk1TCWNWqxWV4J6o", symbol: "DAI"},
    %{name: "PYUSD", address: " 2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo", symbol: "PYUSD"}
  ]

  def mount(_params, _session, socket) do
    {:ok, assign(socket,
      page_title: "Retailer Dashboard",
      account_created: false,
      selected_mint: nil,
      stable_tokens: @stable_tokens,
      # UI state
      mint_error: nil,
      mint_success: nil,
      dark_mode: false,
      locale: "en",
      active_tab: "account"

    )}
  end
  def handle_event("initialize_invoice_account", _params, socket) do
    socket = push_event(socket, "initialize-invoice-account", %{
        selected_mint: socket.assigns.selected_mint,
    })
    {:noreply, socket}
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

  def handle_event("initialize_invoice_item_account", %{"invoice_item_form" => params}, socket) do
    # selected_token = Enum.find(socket.assigns.stable_tokens, &(&1.address == params["mint"].address))

    itemName = params["itemName"] || "Product"
    price = params["price"] || "1"
    quantity = params["quantity"] || "1"
    expiry = params["expiry"] || "9999999999"
    mint = params["mint"] || socket.assigns.stable_tokens[0].address
    
    # Push the collected values to the JavaScript hook
    socket = push_event(socket, "initialize-invoice-item-account", %{
      itemName: itemName,
      price: price,
      quantity: quantity,
      expiry: expiry,
      mint: mint
    })
    
    {:noreply, socket}
  end

  def handle_event("mint-added", %{"success" => true}, socket) do
    :timer.send_after(3000, self(), :clear_txn_msg)
    {:noreply, assign(socket,
      mint_success: t("admin.mint.success"),
      selected_mint: nil
    )}

  end


  def handle_event("mint-added", %{"success" => false, "error" => error}, socket) do
    # Schedule clearing the error after 5 seconds
    :timer.send_after(3000, self(), :clear_txn_msg)
    
    {:noreply, assign(socket, mint_error: error)}
  end

  def handle_event("item-added", %{"success" => true}, socket) do
    :timer.send_after(3000, self(), :clear_txn_msg)
    {:noreply, assign(socket,
      mint_success: t("admin.mint.success"),
      selected_mint: nil,
    )}

  end


  def handle_event("item-added", %{"success" => false, "error" => error}, socket) do
    # Schedule clearing the error after 5 seconds
    :timer.send_after(3000, self(), :clear_txn_msg)
    
    {:noreply, assign(socket, mint_error: error)}
  end

  def handle_info(:clear_txn_msg, socket) do
    {:noreply, assign(socket, mint_error: nil, mint_success: nil)}
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
                   <!-- Error/Success Messages -->
                  <%= if @mint_error do %>

                    <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      <%= @mint_error %>
                    </div>
                  <% end %>

                  <%= if @mint_success do %>
                    <div class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                      <%= @mint_success %>
                    </div>

                  <% end %>              
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
               
               <button 
                 phx-hook="RetailerMintHook"
                 id="initialize-invoice-account-btn"
                 phx-click="initialize_invoice_account"
                 class={if(@dark_mode, do: "bg-blue-600 hover:bg-blue-700", else: "bg-blue-500 hover:bg-blue-600") <> " px-6 py-3 text-white rounded-lg"}>
                 Create Account
               </button>
             </div>
           </div>

           <!-- Add Item Tab -->
           <div class={["#{if @active_tab != "add_item", do: "hidden"}"]}>
             <div class={if(@dark_mode, do: "bg-gray-800 text-white", else: "bg-white text-gray-900") <> " rounded-lg p-6 shadow-md"}>
               <h2 class="text-xl font-semibold mb-4">Add New Item</h2>
                   <!-- Error/Success Messages -->
                  <%= if @mint_error do %>

                    <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      <%= @mint_error %>
                    </div>
                  <% end %>

                  <%= if @mint_success do %>
                    <div class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                      <%= @mint_success %>
                    </div>

                  <% end %>    
               <.form for={%{}} as={:invoice_item_form} phx-submit="initialize_invoice_item_account"> 
               <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div>
                   <label class="blo
                     ck text-sm font-medium mb-2">Item Name</label>
                   <input 
                     type="text"
                     name="invoice_item_form[itemName]"
                     class={if(@dark_mode, do: "bg-gray-700 border-gray-600 text-white", else: "bg-white border-gray-300 text-gray-900") <> " w-full px-3 py-2 border rounded-md focus:border-blue-500"}
                   />
                 </div>
                 
                 <div>
                   <label class="block text-sm font-medium mb-2">Price</label>
                   <input 
                     type="number"
                     name="invoice_item_form[price]"
                     class={if(@dark_mode, do: "bg-gray-700 border-gray-600 text-white", else: "bg-white border-gray-300 text-gray-900") <> " w-full px-3 py-2 border rounded-md focus:border-blue-500"}
                   />
                 </div>

                 <div>
                   <label class="block text-sm font-medium mb-2">Quantity</label>
                   <input 
                     type="number"
                     name="invoice_item_form[quantity]"
                     class={if(@dark_mode, do: "bg-gray-700 border-gray-600 text-white", else: "bg-white border-gray-300 text-gray-900") <> " w-full px-3 py-2 border rounded-md focus:border-blue-500"}
                   />
                 </div>

                 <div>
                   <label class="block text-sm font-medium mb-2">Expiry Date</label>
                   <input 
                     type="datetime-local"
                     name="invoice_item_form[expiry]"
                     class={if(@dark_mode, do: "bg-gray-700 border-gray-600 text-white", else: "bg-white border-gray-300 text-gray-900") <> " w-full px-3 py-2 border rounded-md focus:border-blue-500"}
                   />
                 </div>
               </div>
               <select
                  name="invoice_item_form[mint]"
                  class={[
                    "w-full md:w-64 px-4 py-3 rounded-lg border transition-colors duration-200",
                    if(@dark_mode,
                      do: "bg-gray-700 border-gray-600 text-white",
                      else: "bg-white border-gray-200 text-gray-700"
                    )
                  ]}
                >
                  <option value="" disabled >Mint</option>
                  <%= for token <- @stable_tokens do %>
                    <option 
                      value={token.address} 
                    >
                      <%= token.name %> (<%= token.symbol %>)
                    </option>
                  <% end %>
               </select>

               <div class="mb-6">
                 <label class="block text-sm font-medium mb-2">Description</label>
                 <textarea 
                   rows="4"
                   name="invoice_item_form[description]"
                   class={if(@dark_mode, do: "bg-gray-700 border-gray-600 text-white", else: "bg-white border-gray-300 text-gray-900") <> " w-full px-3 py-2 border rounded-md focus:border-blue-500"}
                 ></textarea>
               </div>
               
               <button
                   type = "submit"
                   phx-hook="RetailerMintHook"
                   id="initialize-invoice-item-account-btn"
                   class={if(@dark_mode, do: "bg-green-600 hover:bg-green-700", else: "bg-green-500 hover:bg-green-600") <> " px-6 py-3 text-white rounded-lg"}>
                 Add Item
               </button>
               </.form>
             </div>
           </div>
         </div>
       </div>
    """
  end
end
