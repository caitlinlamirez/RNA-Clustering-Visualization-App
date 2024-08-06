import mongoose from "mongoose";

const RNASchema = new mongoose.Schema({
    index: {type: Number},
    lineage: {type: String},
    gene_symbol: {type: String},
    rna_value: {type: Number}
}, {collection:"cols_10_rows_10000"});


export const RnaModel = mongoose.model("cols_10_rows_10000", RNASchema); 