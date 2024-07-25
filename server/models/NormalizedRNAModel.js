import mongoose from "mongoose";

const NormalizedRNASchema = new mongoose.Schema({
    index: {type: Number},
    lineage: {type: String},
    gene_symbol: {type: String},
    rna_value: {type: Number}
}, {collection:"normalized_map"});


export const normalizedRNAModel = mongoose.model("normalized_map", NormalizedRNASchema); 