import express from 'express'; 
import { RnaModel } from '../models/RnaModel.js';
import { normalizedRNAModel } from '../models/NormalizedRNAModel.js';
import mongoose from 'mongoose';
import axios from 'axios';
import startCluster from './cluster.js';


const router = express.Router(); // Sets up Express router


// batch --> Allows user to batch multiple API Requests at once
router.post('/batch', async (req, res) => {
  const batchRequests = req.body;
  const batchResults = await processBatch(batchRequests);
  res.json(batchResults);
});

async function processBatch(batchRequests) {
  try {
    const promises = batchRequests.map(request => processSingleRequest(request));
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    // Handle any errors here
    console.error('Batch processing failed:', error);
    return [];
  }
}

async function processSingleRequest(request) {
  // Perform the actual processing for a single request
  try {
    const response = await axios.get(request.url);
    return response.data;

  } catch (error) {
    // Handle errors for individual requests if needed
    console.error('Error processing single request:', error);
    throw error; // Rethrow the error to propagate it to the caller
  }
}

/**
 * router.get('/searchRanges', async (req, res) => {
  try {
    // Get query parameters
    const tissueLineages = req.query.tissueLineages || [];
    const geneSymbols = req.query.geneSymbols || [];
    const c_value = req.query.c_value; 

    // Get map that contain the specified ranges
    const slicedMapData = await RnaModel.find({
      $and: [
        { gene_symbol: { $in: geneSymbols } },
        { lineage: { $in: tissueLineages } },
      ]
    }).sort({ index: 1 });

    const geneSymbolsToRemove = [];
    geneSymbols.forEach(gene_sym => {
      // Look for all objects with {gene_symbol: gene_sym} in defaultMapdata
      const objectsWithGeneSymbol = slicedMapData.filter(obj => obj.gene_symbol === gene_sym);
      const allRnaValuesSet = objectsWithGeneSymbol.flatMap(obj => obj.rna_value); // Get all RNA values within the gene_sym
      
      const valuesUnderc = []
      let numColumns = 0;
      for (const val of allRnaValuesSet) {
        numColumns += 1;
        if (val < c_value) {
          valuesUnderc.push(val)
        }
      }
      if (valuesUnderc.length === numColumns) {
        geneSymbolsToRemove.push(gene_sym)
      }
    });

    const filteredGeneSymbols = geneSymbols.filter(symbol => !geneSymbolsToRemove.includes(symbol));
    const filteredMap = await RnaModel.find({
      $and: [
        { gene_symbol: { $in: filteredGeneSymbols} },
        { lineage: { $in: tissueLineages } }
      ]
    }).sort({ index: 1 });

    const rowLabels = [...new Set(Object.values(filteredMap).flatMap((obj) => obj.gene_symbol))];
    const columnLabels = [...new Set(Object.values(filteredMap).flatMap((obj) => obj.lineage))];

    const normalizedMap = await normalizedRNAModel.find({
      $and: [
        { gene_symbol: { $in: filteredGeneSymbols } },
        { lineage: { $in: tissueLineages } }
      ]
    }).sort({ index: 1 });
  
    res.json({
      row_labels: rowLabels,
      column_labels: columnLabels, 
      map_data: filteredMap,
      normalized_map_data: normalizedMap
    });
  } catch (err) {
    res.json(err);
  }
});
 */
// getValues --> Returns dictionary of objects containing selected ranges of tissueLineages and geneSymbols


// getValues --> Returns dictionary of objects containing selected ranges of tissueLineages and geneSymbols
router.get('/searchRanges2', async (req, res) => {
  try {
    // Parse start and end values for rows and columns from query parameters
    const tissueLineagesStart = parseInt(req.query.tissueLineagesStart) || 0;
    const tissueLineagesEnd = parseInt(req.query.tissueLineagesEnd + 1) || 0;
    const geneSymbolsStart = parseInt(req.query.geneSymbolsStart) || 0;
    const geneSymbolsEnd = parseInt(req.query.geneSymbolsEnd + 1) || 0;
    const c_value = parseFloat(req.query.c_value);

    // Fetch all unique tissueLineages and geneSymbols from the database
    const allTissueLineages = await RnaModel.distinct('lineage');
    const allGeneSymbols = await RnaModel.distinct('gene_symbol');

    // Slice the arrays based on start and end values
    const tissueLineages = allTissueLineages.slice(tissueLineagesStart, tissueLineagesEnd);
    const geneSymbols = allGeneSymbols.slice(geneSymbolsStart, geneSymbolsEnd);

    // Get map that contain the specified ranges
    const slicedMapData = await RnaModel.find({
      $and: [
        { gene_symbol: { $in: geneSymbols } },
        { lineage: { $in: tissueLineages } },
      ]
    }).sort({ index: 1 });

    const geneSymbolsToRemove = [];
    geneSymbols.forEach(gene_sym => {
      // Look for all objects with {gene_symbol: gene_sym} in defaultMapdata
      const objectsWithGeneSymbol = slicedMapData.filter(obj => obj.gene_symbol === gene_sym);
      const allRnaValuesSet = objectsWithGeneSymbol.flatMap(obj => obj.rna_value); // Get all RNA values within the gene_sym
      
      const valuesUnderc = [];
      let numColumns = 0;
      for (const val of allRnaValuesSet) {
        numColumns += 1;
        if (val < c_value) {
          valuesUnderc.push(val);
        }
      }
      if (valuesUnderc.length === numColumns) {
        geneSymbolsToRemove.push(gene_sym);
      }
    });

    const filteredGeneSymbols = geneSymbols.filter(symbol => !geneSymbolsToRemove.includes(symbol));
    const filteredMap = await RnaModel.find({
      $and: [
        { gene_symbol: { $in: filteredGeneSymbols } },
        { lineage: { $in: tissueLineages } }
      ]
    }).sort({ index: 1 });

    const rowLabels = [...new Set(Object.values(filteredMap).flatMap((obj) => obj.gene_symbol))];
    const columnLabels = [...new Set(Object.values(filteredMap).flatMap((obj) => obj.lineage))];

    const normalizedMap = await normalizedRNAModel.find({
      $and: [
        { gene_symbol: { $in: filteredGeneSymbols } },
        { lineage: { $in: tissueLineages } }
      ]
    }).sort({ index: 1 });
  
    res.json({
      row_labels: rowLabels,
      column_labels: columnLabels,
      map_data: filteredMap,
      normalized_map_data: normalizedMap
    });
  } catch (err) {
    res.json(err);
  }
});

/**  
router.get('/getDefaultData', async (req, res) => {
  try {
    // Get tissueLineages and geneSymbols from query parameters
    const rows = req.query.rows || 0;
    const columns = req.query.columns || 0;
    
    // Fetch distinct gene symbols and tissue lineages
    const distinctGeneSymbols = await RnaModel.find({}).distinct('gene_symbol');
    const distinctTissueLineages = await RnaModel.find({}).distinct('lineage');

    // Slice to default ranges (300 rows x 10 columns )
    const slicedGeneSymbols = distinctGeneSymbols.slice(0,rows);
    const slicedTissueLineages = distinctTissueLineages.slice(0,columns);

    // Filter out the objects that contain the specified ranges
    const defaultMapData = await RnaModel.find({
      $and: [
        { gene_symbol: { $in: slicedGeneSymbols } },
        { lineage: { $in: slicedTissueLineages } }
      ]
    }).sort({ index: 1 });

    const defaultNormalizedMapData = await normalizedRNAModel.find({
      $and: [
        { gene_symbol: { $in: slicedGeneSymbols } },
        { lineage: { $in: slicedTissueLineages } }
      ]
    }).sort({ index: 1 });

    res.json({
      geneSet: distinctGeneSymbols,
      tissueLineageSet: distinctTissueLineages,
      defaultMapData: defaultMapData,
      defaultNormalizedMapData: defaultNormalizedMapData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
**/


router.get('/getDefaultData', async (req, res) => {
  try {
    // Get query parameters
    const rows = req.query.rows || 0;
    const columns = req.query.columns || 0;
    const c_value = req.query.c_value // filter out rna_values less than this c_value

    // Get distinct gene symbols and tissue lineages
    const distinctGeneSymbols = await RnaModel.find({}).distinct('gene_symbol').sort({index:1});
    const distinctTissueLineages = await RnaModel.find({}).distinct('lineage').sort({index:1});
    
    // Slice to default ranges (300 rows x 18 columns)
    const slicedGeneSymbols = distinctGeneSymbols.slice(0,rows);
    const slicedTissueLineages = distinctTissueLineages.slice(0,columns);

    // Gets map of objects that contain the specified ranges
    const slicedMap = await RnaModel.find({
      $and: [
        { gene_symbol: { $in: slicedGeneSymbols } },
        { lineage: { $in: slicedTissueLineages } },
      ]
    }).sort({ index: 1 });

    // Determine which rows have all values under the c_value
    const geneSymbolsToRemove = [];
    slicedGeneSymbols.forEach(gene_sym => {
      // Get list of all objects containing the current gene_symbol in slicedMap
      const objectsWithGeneSymbol = slicedMap.filter(obj => obj.gene_symbol === gene_sym);
      // Get list of all RNA values within the the current gene_symbol 
      const allRnaValuesSet = objectsWithGeneSymbol.flatMap(obj => obj.rna_value);
      
      const valuesUnderc = []
      let numColumns = 0;
      for (const val of allRnaValuesSet) {
        numColumns += 1;
        if (val < c_value) {
          valuesUnderc.push(val)
        }
      }

      if (valuesUnderc.length === numColumns) {
        geneSymbolsToRemove.push(gene_sym)
      }
    });

    // Remove gene_symbols that all values are under the c_value
    const filteredGeneSymbols = slicedGeneSymbols.filter(symbol => !geneSymbolsToRemove.includes(symbol));

    const defaultMap = await RnaModel.find({
      $and: [
        { gene_symbol: { $in: filteredGeneSymbols} },
        { lineage: { $in: slicedTissueLineages } }
      ]
    }).sort({ index: 1 });

    const defaultNormalizedMap = await normalizedRNAModel.find({
      $and: [
        { gene_symbol: { $in: filteredGeneSymbols } },
        { lineage: { $in: slicedTissueLineages } }
      ]
    }).sort({ index: 1 });

    // Get current rowLabels and columnLabels
    const rowLabels = [...new Set(Object.values(defaultMap).flatMap((obj) => obj.gene_symbol))];
    const columnLabels = [...new Set(Object.values(defaultMap).flatMap((obj) => obj.lineage))];

    res.json({
      gene_set: distinctGeneSymbols,
      tissue_lineage_set: distinctTissueLineages,
      row_labels: rowLabels, 
      column_labels: columnLabels,
      default_map: defaultMap,
      default_normalized_map: defaultNormalizedMap
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/addData', async (req, res) => {
  try {
    const dataToAdd = { 
      index: 0, 
      lineage: "lineage1", 
      gene_symbol: 'gs1',
      rna_value: 0
    };

    const result = new normalizedRNAModel(dataToAdd);

    await result.save();
    res.status(200).json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 
router.post('/testPython', async (req, res) => {
  async function runPythonScript(scriptPath, args) {
    try {
      // Get query parameters
      const rows = 30;
      const columns = 10;

      // Get distinct gene symbols and tissue lineages
      const distinctGeneSymbols = await RnaModel.distinct('gene_symbol').sort({ index: 1 });
      const distinctTissueLineages = await RnaModel.distinct('lineage').sort({ index: 1 });
      const slicedGeneSymbols = distinctGeneSymbols.slice(0,rows);
      const slicedTissueLineages = distinctTissueLineages.slice(0,columns);

      // Gets map of objects that contain the specified ranges
      const slicedMap = await RnaModel.find({
        gene_symbol: { $in: slicedGeneSymbols },
        lineage: { $in: slicedTissueLineages }
      }).sort({ index: 1 });

      
      const stringified = JSON.stringify(slicedMap)
      //console.log("STRINGIFIED", stringified)
      const python_process = spawn('python', [scriptPath, args]);

      // Collect data from script and print to console
      python_process.stdout.on('data', (data) => {
        console.log("Data received from python script:", data.toString());

    });
    
      // When script is finished, print collected data
      python_process.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
      });
    } catch (error) {
      console.error('Error running Python script:', error);
    }
  }

  runPythonScript('./routes/testPython.py', [1, 2, 3, 4, 5]);
});


router.post('/testCluster', async(req, res) => {
  startCluster()
  res.send('Cluster started!');
})
 */
export { router as MainRouter };
