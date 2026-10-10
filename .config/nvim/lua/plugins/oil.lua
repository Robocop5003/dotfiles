return {
  "stevearc/oil.nvim",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  lazy = false,
  config = function()
    require("oil").setup({
      view_options = {
        show_hidden = true,
      },
      keymaps = {
        ["q"] = "<cmd>bd<CR>",
      },
    })
    vim.keymap.set("n", "-", "<CMD>Oil<CR>", { desc = "Otwórz strukturę plików" })
  end,
}
