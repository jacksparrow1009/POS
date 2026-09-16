export const navItems = [
  "Dashboard",
  "POS",
  "Products",
  "Inventory",
  "Purchases",
  "Customers",
  "Reports",
  "Settings",
] as const;

export const metrics = [
  { label: "Today sales", value: "PKR 184,250", delta: "+12.4%" },
  { label: "Gross profit", value: "PKR 41,830", delta: "+8.1%" },
  { label: "Open register", value: "PKR 57,400", delta: "Shift 02" },
  { label: "Low stock", value: "18 SKUs", delta: "Needs review" },
] as const;

export const cart = [
  { name: "Coke 500ml", qty: 6, price: 780 },
  { name: "Surf Excel 1kg", qty: 2, price: 1560 },
  { name: "Dairy Milk 87g", qty: 4, price: 1360 },
  { name: "National Ketchup", qty: 1, price: 420 },
] as const;

export const products = [
  { sku: "BEV-001", name: "Coke 500ml", branch: "Gulberg", stock: 52, alert: 20 },
  { sku: "HPC-221", name: "Surf Excel 1kg", branch: "Gulberg", stock: 11, alert: 15 },
  { sku: "SNK-094", name: "Dairy Milk 87g", branch: "DHA", stock: 7, alert: 18 },
  { sku: "GRC-558", name: "National Ketchup", branch: "Johar Town", stock: 31, alert: 12 },
] as const;

export const activity = [
  "Sale POS-1048 completed by Ayesha",
  "Opening stock imported for 42 variants",
  "Purchase bill PB-233 added from Metro Supplier",
  "Refund processed for receipt R-8801",
] as const;

export const setupSteps = [
  { label: "Business created", done: true },
  { label: "Branch configured", done: true },
  { label: "Products imported", done: true },
  { label: "Opening stock added", done: true },
  { label: "Subscription connected", done: false },
] as const;
