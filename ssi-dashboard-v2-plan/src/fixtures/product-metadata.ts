import type { ProductMetadata } from "@/lib/product-metadata";

export const sampleProductMetadata: ProductMetadata = {
  products: [
    { id: "p-hose", key: "hose", name: "HOSE", headline_metric_id: "m-thi-phan-co-so", sort_order: 1, is_visible: true },
    { id: "p-margin", key: "margin", name: "Margin", headline_metric_id: "m-tong-du-no-margin", sort_order: 2, is_visible: true },
    { id: "p-phaisinh", key: "phaisinh", name: "Phái Sinh", headline_metric_id: "m-thi-phan-phai-sinh", sort_order: 3, is_visible: true },
    { id: "p-scash", key: "scash", name: "S-Cash", headline_metric_id: "m-so-du-scash", sort_order: 4, is_visible: true },
    { id: "p-sfund", key: "sfund", name: "S-Fund", headline_metric_id: "m-so-du-sfund", sort_order: 5, is_visible: true },
    { id: "p-momoi", key: "momoi", name: "Mở mới", headline_metric_id: "m-slkh-mo-moi", sort_order: 6, is_visible: true },
  ],
  subProducts: [
    { id: "sp-t7", product_id: "p-margin", name: "T+7", sort_order: 1, is_visible: true },
    { id: "sp-trading-plus", product_id: "p-margin", name: "Trading Plus", sort_order: 2, is_visible: true },
    { id: "sp-mplus", product_id: "p-margin", name: "M+", sort_order: 3, is_visible: true },
    { id: "sp-dplus", product_id: "p-phaisinh", name: "D+", sort_order: 1, is_visible: true },
  ],
  metrics: [
    { id: "m-thi-phan-co-so", column_key: "thi_phan_co_so", label: "Thị Phần HOSE", unit: "%", product_id: "p-hose", sub_product_id: null, placement: "headline", sort_order: 1, is_visible: true, is_percent: true, is_inverse: false },
    { id: "m-thanh-khoan-ttcs", column_key: "thanh_khoan_ttcs", label: "Thanh khoản thị trường", unit: "tỷ", product_id: "p-hose", sub_product_id: null, placement: "normal", sort_order: 2, is_visible: true, is_percent: false, is_inverse: false },
    { id: "m-gtgd-cs-ssi", column_key: "gtgd_cs_ssi", label: "GTGD SSI", unit: "tỷ", product_id: "p-hose", sub_product_id: null, placement: "normal", sort_order: 3, is_visible: true, is_percent: false, is_inverse: false },
    { id: "m-thi-phan-cn", column_key: "thi_phan_cn", label: "Thị Phần CN", unit: "%", product_id: "p-hose", sub_product_id: null, placement: "normal", sort_order: 4, is_visible: true, is_percent: true, is_inverse: false },
    { id: "m-thi-phan-ds", column_key: "thi_phan_ds", label: "Thị Phần DS", unit: "%", product_id: "p-hose", sub_product_id: null, placement: "normal", sort_order: 5, is_visible: true, is_percent: true, is_inverse: false },
    { id: "m-tong-du-no-margin", column_key: "tong_du_no_margin", label: "Tổng dư nợ Margin TK6+7", unit: "tỷ", product_id: "p-margin", sub_product_id: null, placement: "headline", sort_order: 1, is_visible: true, is_percent: false, is_inverse: false },
    { id: "m-slkh-margin", column_key: "slkh_margin", label: "SLKH Margin", unit: "KH", product_id: "p-margin", sub_product_id: null, placement: "normal", sort_order: 2, is_visible: true, is_percent: false, is_inverse: false },
    { id: "m-du-no-t7", column_key: "du_no_t7", label: "Dư nợ T+7", unit: "tỷ", product_id: "p-margin", sub_product_id: "sp-t7", placement: "sub_product", sort_order: 3, is_visible: true, is_percent: false, is_inverse: false },
    { id: "m-slkh-t7", column_key: "slkh_t7", label: "SLKH T+7", unit: "KH", product_id: "p-margin", sub_product_id: "sp-t7", placement: "sub_product", sort_order: 4, is_visible: true, is_percent: false, is_inverse: false },
    { id: "m-du-no-trading-plus", column_key: "du_no_trading_plus", label: "Dư nợ Trading Plus", unit: "tỷ", product_id: "p-margin", sub_product_id: "sp-trading-plus", placement: "sub_product", sort_order: 5, is_visible: true, is_percent: false, is_inverse: false },
    { id: "m-du-no-mplus", column_key: "du_no_mplus", label: "Dư nợ M+", unit: "tỷ", product_id: "p-margin", sub_product_id: "sp-mplus", placement: "sub_product", sort_order: 6, is_visible: true, is_percent: false, is_inverse: false },
    { id: "m-thi-phan-phai-sinh", column_key: "thi_phan_phai_sinh", label: "Thị Phần Phái Sinh", unit: "%", product_id: "p-phaisinh", sub_product_id: null, placement: "headline", sort_order: 1, is_visible: true, is_percent: true, is_inverse: false },
    { id: "m-thanh-khoan-tt-ps", column_key: "thanh_khoan_tt_ps", label: "Thanh khoản TTPS", unit: "HĐ", product_id: "p-phaisinh", sub_product_id: null, placement: "normal", sort_order: 2, is_visible: true, is_percent: false, is_inverse: false },
    { id: "m-ty-le-slhd-dplus", column_key: "ty_le_slhd_dplus", label: "Tỷ Lệ SLHĐ D+", unit: "%", product_id: "p-phaisinh", sub_product_id: "sp-dplus", placement: "sub_product", sort_order: 3, is_visible: true, is_percent: true, is_inverse: false },
    { id: "m-so-du-scash", column_key: "so_du_scash", label: "Số dư S-Cash", unit: "tỷ", product_id: "p-scash", sub_product_id: null, placement: "headline", sort_order: 1, is_visible: true, is_percent: false, is_inverse: false },
    { id: "m-slkh-scash", column_key: "slkh_scash", label: "SLKH S-Cash", unit: "KH", product_id: "p-scash", sub_product_id: null, placement: "normal", sort_order: 2, is_visible: true, is_percent: false, is_inverse: false },
    { id: "m-so-du-sfund", column_key: "so_du_sfund", label: "Số dư S-Fund", unit: "tỷ", product_id: "p-sfund", sub_product_id: null, placement: "headline", sort_order: 1, is_visible: true, is_percent: false, is_inverse: false },
    { id: "m-slkh-sfund", column_key: "slkh_sfund", label: "SLKH S-Fund", unit: "KH", product_id: "p-sfund", sub_product_id: null, placement: "normal", sort_order: 2, is_visible: true, is_percent: false, is_inverse: false },
    { id: "m-slkh-mo-moi", column_key: "slkh_mo_moi", label: "KH mở tài khoản mới", unit: "tài khoản", product_id: "p-momoi", sub_product_id: null, placement: "headline", sort_order: 1, is_visible: true, is_percent: false, is_inverse: false },
  ],
};
