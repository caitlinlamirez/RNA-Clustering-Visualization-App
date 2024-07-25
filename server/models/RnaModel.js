import mongoose from "mongoose";

const RNASchema = new mongoose.Schema({
    index: {type: Number},
    lineage: {type: String},
    gene_symbol: {type: String},
    rna_value: {type: Number}
}, {collection:"rna_values"});


export const RnaModel = mongoose.model("rna_values", RNASchema); 