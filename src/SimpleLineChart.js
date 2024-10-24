import React, { useState, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ReactComponent as Logo } from './logo.svg';

const SimpleLineChart = () => {
  const [data, setData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        // samplingTime should be divided by 600 (original value is in 10 milliseconds?)
        jsonData.testData.samples.forEach(sample => {
          sample.samplingTime = sample.samplingTime / 600;
        });
        setData(jsonData);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Error loading file. Please make sure it\'s a valid JSON file exported from the virus.sucks app.');
      }
    };

    reader.readAsText(file);
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/json") {
      processFile(file);
    } else {
      alert('Please drop a valid JSON file.');
    }
  };

  const processedData = useMemo(() => {
    if (!data) return [];

    const groupedData = data.testData.samples.reduce((acc, sample) => {
      const key = sample.samplingTime;
      if (!acc[key]) acc[key] = {};
      acc[key][sample.startingChannel] = sample.firstChannelResult;
      acc[key].samplingTime = sample.samplingTime;
      return acc;
    }, {});

    return Object.values(groupedData);
  }, [data]);

  const channels = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.testData.samples.map(sample => sample.startingChannel))];
  }, [data]);

  const getDetectionResultText = (detectionResult) => {
    switch (detectionResult) {
      case 1: return 'Negative';
      case 2: return 'Positive';
      case 3: return 'Invalid';
      default: return 'Unknown';
    }
  };

  const getDetectionResultStyle = (detectionResult) => {
    switch (detectionResult) {
      case 1: return { color: 'green', fontWeight: 'bold', marginLeft: '4px' };
      case 2: return { color: 'red', fontWeight: 'bold', marginLeft: '4px' };
      case 3: return { color: 'orange', fontWeight: 'bold', marginLeft: '4px' };
      default: return {};
    }
  };

  return (
    <div className="chart-container">
      <div 
        className={`file-picker ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Logo className="logo" alt="virus.sucks plotter logo" />
        <span>Load and plot a PlusLife tests results file exported from the <a href="https://virus.sucks" target="_blank" rel="noopener noreferrer">virus.sucks</a> app:</span>
        <input type="file" onChange={handleFileUpload} accept=".json" />
        <p>or drag and drop a JSON file here</p>
      </div>
      <div className='disclaimer'>
        Disclaimer: this data is not transmitted to any server. It is processed only in your browser. Source code is available <a href="https://github.com/gacevedo/virus-sucks-plotter" target="_blank" rel="noopener noreferrer"> on GitHub</a>.
      </div>
      {data && (
        <div className='test-info'>
          <p>Test type: <span className='test-type'>{data.testType}</span> | Test result: 
            <span style={getDetectionResultStyle(data.testResult.detectionResult)}>
              {getDetectionResultText(data.testResult.detectionResult)}
            </span>
          </p>
        </div>
      )}
      {data && (
        <LineChart 
          width={800} 
          height={400}
          data={processedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="samplingTime" 
            tickFormatter={(value) => value.toFixed(1)}
            label={{ value: "Time since start (min)", position: "bottom", offset: 0 }}
          />
          <YAxis
            label={{ value: "Fluorescence value", angle: -90, position: "insideLeft", offset: -8 }}
          />
          <Tooltip />
          <Legend 
            wrapperStyle={{ fontSize: '12px', fontFamily: 'Arial, sans-serif' }}
          />
          {channels.map((channel, index) => (
            <Line
              key={channel}
              type="monotone"
              dataKey={channel.toString()}
              stroke={`hsl(${(index * 360) / channels.length}, 70%, 50%)`}
              name={channel === 3 ? `Channel ${channel + 1} (control)` : `Channel ${channel + 1}`}
            />
          ))}
        </LineChart>
      )}
    </div>
  );
};

export default SimpleLineChart;
