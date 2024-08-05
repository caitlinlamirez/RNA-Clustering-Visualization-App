import './App.css';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SAGE3Plugin } from "https://unpkg.com/@sage3/sageplugin@0.0.15/src/lib/sageplugin.js";
import axios from 'axios'
const apiUrl = "https://rna-clustering-visualization-app-production.up.railway.app/"

const App = () => {
    const defaultRows = 400;
    const defaultColumns = 10;
    const defaultCValue = 0;
    const cValueChoices = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

    const svgRef = useRef(null);
    const legendRef = useRef(null);
    const [isNormMapDisplayed, setisNormMapDisplayed] = useState(false);
    const [isFilterMenuOpen, setisFilterMenuOpen] = useState(false);

    const [dataMap, setDataMap] = useState([]);
    const [normalizedMap, setNormalizedMap] = useState([]);

    const [trimmedRows, setTrimmedRows] = useState(defaultRows);
    const [trimmedColumns, setTrimmedColumns] = useState(defaultColumns);
    const [rowLabels, setRowLabels] = useState([]);
    const [columnLabels, setColumnLabels] = useState([]);
    const [cValue, setCValue] = useState(defaultCValue);

    const [geneSet, setGeneSet] = useState([]);
    const [tissueLineageSet, setTissueLineageSet] = useState([]);

    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const toggleDropDown = (event) => {
      event.preventDefault()
      setisFilterMenuOpen(!isFilterMenuOpen);
    };

    // useEffect to store default matrix
    useEffect(() => {
      const fetchData = async () => {
        try {
          // Check if data is already stored in sessionStorage
          const storedData = sessionStorage.getItem('storedData');
          if (storedData) {
            // Extract properties from storedData object
            const { gene_set, tissue_lineage_set, row_labels, column_labels, default_map, default_normalized_map } = JSON.parse(storedData);
            
            setGeneSet(gene_set);
            setTissueLineageSet(tissue_lineage_set);

            setRowLabels(row_labels);
            setColumnLabels(column_labels);
            setTrimmedRows(row_labels.length);
            setTrimmedColumns(column_labels.length);

            setDataMap(default_map);
            setNormalizedMap(default_normalized_map);
          } else {
            // If data is not stored, fetch it from the server
            const response = await axios.get('https://rna-clustering-visualization-app-production.up.railway.app/values/getDefaultData', {
              params: {
                rows: trimmedRows,
                columns: trimmedColumns,
                c_value: cValue,
              }});
            
            const data = response.data;
            setGeneSet(data.gene_set);
            setTissueLineageSet(data.tissue_lineage_set);

            setRowLabels(data.row_labels);
            setColumnLabels(data.column_labels);
            setTrimmedRows(data.row_labels.length);
            setTrimmedColumns(data.column_labels.length);

            setDataMap(data.default_map);
            setNormalizedMap(data.default_normalized_map);
  
            // Store data in one object in sessionStorage
            sessionStorage.setItem('storedData', JSON.stringify(data));
          }
        } catch (error) {
          console.error('API request failed:', error);
        }
      };
      // Call the function to fetch data
      fetchData();
    }, []);

    // useEffect for removing existing SVG elements
    useEffect(() => {
      const svgContainer = d3.select(svgRef.current);
      svgContainer.selectAll("*").remove();
    }, [isNormMapDisplayed, dataMap]);
    
    // useEffect to create actual matrix 
    useEffect(() => {
      // Check if any label has 22 or more characters
      const isLabelTooLong = rowLabels.some(label => label.length >= 22);
      const translateAmount = isLabelTooLong ? 120 : 0;

      // Define constants
      const rectSize = 25;
      const labelSpacing = 27;
      const rectSpacing = 27;
      const margin = { top: 120 , right: 20, bottom: 10, left: 100 + translateAmount };
      const height = (trimmedColumns * (rectSize + rectSpacing) * 1);
      const width = (trimmedRows * (rectSize + rectSpacing)) * 0.57;

      // ----------------------------------------------
      const customColorScale = d3.scaleLinear()
        .domain([0.25, 0.5, 0.75, 1])
        .range(["white", "lightgrey", "grey", "black"]);

      // Create a tooltip
      var tooltip = d3.select("body")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("box-shadow", "0 5px 5px rgba(0, 0, 0, 0.1)");
    
      // Create the SVG container
      const svg = d3.select(svgRef.current)
        .attr("width", (width))
        .attr("height", height )
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Add row labels (NOTE: these are switched, so the row labels actually display the original dataset's columns)
      const rowLabelsGroup = svg.append("g")
      .attr("class", "row-labels"); 
      rowLabelsGroup.selectAll("text")
        .data(Array.from(columnLabels))
        .enter()
        .append("text")
        .text((d, i) => `${tissueLineageSet.indexOf(d)}: ${d}`)
        .attr("x", - margin.left)
        .attr("y", (d, i) => i * labelSpacing + labelSpacing / 2)
        .style("text-anchor", "start")
        .style("alignment-baseline", "middle")
        .style("font-size", "10px")
        .attr("fill", "black");

      // Add column Labels (NOTE: these are switched, so the column labels actually display the original dataset's rows)
      const columnLabelsGroup = svg.append("g")
        .attr("class", "column-labels");
      columnLabelsGroup.selectAll("text")
        .data(Array.from(rowLabels))
        .enter()
        .append("text")
        .text((d, i) => `${geneSet.indexOf(d)}: ${d}`)
        .attr("x", (d, i) => labelSpacing) // Adjust the x position for column labels
        .attr("y", 15) // Adjust the y position for column labels
        .style("text-anchor", "start")
        .style("alignment-baseline", "middle")
        .style("font-size", "10px")
        .attr("fill", "black")
        .attr("transform", (d, i) => `rotate(-90) translate(-15, ${i * labelSpacing})`); // Rotate the text to be vertical

      // Create the heatmap using rectangles
      svg
        .selectAll("rect")
        .data(isNormMapDisplayed ? normalizedMap : dataMap)
        .enter()
        .append("rect")
        // Multiply the following by scale factors to adjust space between the cells
        .attr("x", (d, i) => (i % trimmedRows) * rectSpacing) // Set x based on the column index
        .attr("y", (d, i) => Math.floor(i / trimmedRows) * rectSpacing) // Set y based on the row index
        .attr("rx", 0.5)
        .attr("ry", 0.5)
        // Adjust rectangle size
        .attr("width", rectSize) 
        .attr("height", rectSize)
        .style("stroke", "black")
        .style("stroke-width", 0.3)

        // If isNormMapDisplayed == True, it gets the normalized data
        .style("fill", (d) => customColorScale(d.rna_value))
        .on("mouseover", function (event, d) {
          // Adjust the tooltip for when user scrolls
          const [x, y] = d3.pointer(event);
          const heatmapContainer = svgRef.current;
          const rect = heatmapContainer.getBoundingClientRect();
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
        
          tooltip.transition()
            .style("opacity", 0.9)
            .style("left", (x + rect.left) + "px")
            .style("top", (y + rect.top + scrollTop) + "px")
            .style("background-color", "white")
            .style("border", "1px solid black")
            
            tooltip.html(`<b>Element:</b> ${d.index}<br>
            <b>RNA Value:</b> ${d.rna_value.toFixed(2)}<br>
            <b>Tissue Lineage:</b> ${d.lineage}<br>
            <b>Gene Symbol:</b> ${d.gene_symbol}`);
        })
        .on("mouseout", function () {
          tooltip.transition()
            .style("opacity", 0)
        });

        /* --------  MAKE A COLOR LEGEND -------*/
        const legendSvg = d3.select(legendRef.current)
          .attr("width", 150)
          .attr("height", 250);
      
        const defs = legendSvg.append("defs");
        const linearGradient = defs.append("linearGradient")
          .attr("id", "linear-gradient")
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "0%")
          .attr("y2", "100%");
        
        linearGradient.selectAll("stop")
          .data(customColorScale.range())
          .enter().append("stop")
          .attr("offset", (d, i) => i / (customColorScale.range().length - 1))
          .attr("stop-color", (d) => d);

        legendSvg.append("rect")
          .attr("width", 35)
          .attr("height", 200)
          .style("fill", "url(#linear-gradient)")
          .attr("transform", "translate(30,10)");

        const legendScale = d3.scaleLinear()
          .domain([1,0])
          .range([200, 0]);

        const legendAxis = d3.axisRight(legendScale)
          .tickSize(45)
          .ticks(6);

        legendSvg.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(30,10)")
          .call(legendAxis);

    }, [isNormMapDisplayed, dataMap, normalizedMap, trimmedRows, trimmedColumns]);


    const filterData = (start1, end1, start2, end2, selectedCValue) => {
      const newRowRange = start1 >= 0 && end1 >= 0
        ? Array.from(geneSet).slice(start1, end1 + 1)
        : [];

      const newColRange = start2 >= 0 && end2 >= 0
        ? Array.from(tissueLineageSet).slice(start2, end2 + 1)
        : [];

      // Make a GET request to the server with the query parameters
      axios.get('https://rna-clustering-visualization-app-production.up.railway.app/values/searchRanges', {
          params: {
            tissueLineagesStart: start2,
            tissueLineagesEnd: end2,
            geneSymbolsStart: start1,
            geneSymbolsEnd: end1,
            c_value: selectedCValue
          }
        })
        .then(response => {
          const data = response.data; 
          setRowLabels(data.row_labels);
          setColumnLabels(data.column_labels);

          setTrimmedRows(data.row_labels.length);
          setTrimmedColumns(data.column_labels.length);

          setDataMap(data.map_data);
          setNormalizedMap(data.normalized_map_data);
          setCValue(selectedCValue);
        })
        .catch(error => {
          console.error('API request failed:', error);
        });
    }

    // Function to handle submit button click to apply filter
    const handleSubmit = (event) => {
      event.preventDefault();
      // Get selected values from geneDropdown and tissueDropDown
      const geneDropdownStart = event.target.querySelector('#geneDropdownStart').selectedIndex;
      const geneDropdownEnd = event.target.querySelector('#geneDropdownEnd').selectedIndex;
      
      const tissueDropdownStart = event.target.querySelector('#tissueDropDownStart').selectedIndex;
      const tissueDropdownEnd = event.target.querySelector('#tissueDropDownEnd').selectedIndex;

      const selectedCValue = event.target.querySelector('#c_value_select').value;

      if (tissueDropdownStart > tissueDropdownEnd && geneDropdownStart > geneDropdownEnd) {
        setIsError(true)
        setErrorMessage("Invalid Ranges. Please check both ranges.")
      } else if (tissueDropdownStart > tissueDropdownEnd) {
        setIsError(true)
        setErrorMessage("Invalid Range. Make sure starting Tissue Lineage is before ending Tissue Lineage")
      } else if (geneDropdownStart > geneDropdownEnd){
        setIsError(true)
        setErrorMessage("Invalid Range. Make sure starting Gene Symbol is before ending Gene Symbol")
      } else {
        filterData(geneDropdownStart, geneDropdownEnd, tissueDropdownStart, tissueDropdownEnd, selectedCValue);
        
        // Remove all existing elements of d3 to update it properly
        const svgContainer = d3.select(svgRef.current);
        svgContainer.selectAll("*").remove();
      }
      };
    
    const handleTabClick = (event, tabId) => {
      // Remove the 'active' class from all tabs
      document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
      });

      // Add the 'active' class to the clicked tab
      event.target.classList.add('active');
      if (tabId == "geneActivationMap") {
        setisNormMapDisplayed(false);
      } else {
        setisNormMapDisplayed(true)
      }
    }

    return (
      <>
        <div className='app-container'>
          {/* HEADER */}
          <div className='header'>
            <div className='heatmap-header'>
            <h1> {isNormMapDisplayed ? 'Normalized Gene Color Map' : 'Gene Expression Percentage Matrix'}</h1>
            <p>Rows: {trimmedRows} </p>
            <p>Columns: {trimmedColumns}</p>
            </div>

            <div className='menubar'>
              <div className='tab-container'>
                <div class='tab active' onClick={(event) => handleTabClick(event, "geneActivationMap")}>Gene Activation Percentage Matrix</div>
                <div class='tab' onClick={(event) => handleTabClick(event, "normalizedMap")}>Normalized Map</div>
              </div>
              <button className= 'dropdown-button' onClick= {(event) => toggleDropDown(event)}>
                <i class="fa-solid fa-filter"></i> Filter Content
              </button>
            </div>
          </div>
          {/* ------------------------------------------------ */}

        {isFilterMenuOpen && (
          <div className='dropdown-content'> 
            <form className='filter-form' onSubmit={handleSubmit}>
              <div className='filter-form-row'>
                <div className='range-block'>
                  <label>Tissue Lineages: </label>
                  <select id="tissueDropDownStart" defaultValue = {columnLabels[0]}>
                    {Array.from(tissueLineageSet).map((lineage, index) => (
                    <option key={index} value={lineage}>
                      {index}: {lineage}
                    </option>
                    ))}
                  </select>
                  <span>to</span>
                  <select id="tissueDropDownEnd" defaultValue = {columnLabels[columnLabels.length - 1]}>
                    {Array.from(tissueLineageSet).map((lineage, index) => (
                      <option key={index} value={lineage}>
                        {index}: {lineage}
                      </option>
                  ))}
                  </select>
                </div>
                <div className='range-block'>
                  <label>Gene Symbols: </label>
                  <select id="geneDropdownStart" defaultValue={rowLabels[0]}>
                    {Array.from(geneSet).map((gene, index) => (
                      <option key={index} value={gene}>
                        {index}: {gene}
                    </option>
                  ))}
                  </select>
                  <span>to</span>
                  <select id="geneDropdownEnd" defaultValue={rowLabels[rowLabels.length - 1]}>
                    {Array.from(geneSet).map((gene, index) => (
                      <option key={index} value={gene}>
                        {index}: {gene}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className='filter-form-row'>
                <div className='range-block'>
                  <label>C-value: </label>
                  <select id="c_value_select" defaultValue = {cValue}>
                  {Array.from(cValueChoices).map((c, index) => (
                      <option key={index} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                
                <input type='submit'></input>
                <button onClick={(event) => {event.preventDefault(), window.location.reload()}}>Reset Filters</button>
              </div>
              <div className='filter-form-row'>
                {isError && (<p className='error-text'><b>Error:</b> {errorMessage}</p>)}
              </div>
              <div className='filter-form-row'>
                <h3><b>Apriori Algorithm</b></h3>
              </div>
              <div className='filter-form-row'>
                <div className='range-block'>
                    <label for="min_support">Minimum Support:</label>
                    <input type="number" id="min_support" min="0"></input>
                    <label for="freq_size">Frequency Size:</label>
                    <input type="number" id="freq_size" min="0"></input>
                </div>
              </div>
              <div className='filter-form-row'>
                <input id="apriori_submit"type='submit' value="Perform Apriori"></input>
              </div>
            </form>       
          </div>
        )}

        <div className='visualization-container'>
          <div className='visualization-body'>
            <div className='xLabel'>
              <h2>Gene Symbols</h2>
            </div>

          <div className='matrix-container'>
            <div className='yLabel'>
              <h2>Tissue Lineages</h2>
            </div>
            
            <div className='heatmap-scrollable'>
              <svg ref={svgRef}></svg>
            </div>

            <div className='right-container'>
              <div className='legend-container'>
                <h3>RNA Values</h3>
                <svg ref={legendRef}></svg>
              </div>
            </div>
          </div>
        
          </div>
        </div>
        </div>
      </>
    );
  };

  export default App;
