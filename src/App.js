import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Graph from './Components/Graph';
//import AttackTreeVisualization from './components/AttackTreeVisualization';

function App() {
    return (
        
            <Router>
                <div>
                    
                    <Routes>
                     
                        <Route path="/" element={< Graph/>} />
                       {/* ///// <Route path="/AttackTreeVisualization" element={< AttackTreeVisualization/>} /> */}

                    </Routes>
                </div>
            </Router>
        
    );
}

export default App;
