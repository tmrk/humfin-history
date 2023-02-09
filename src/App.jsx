import CssBaseline from '@mui/material/CssBaseline';
import './App.css';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { Typography } from '@mui/material';
import Container from '@mui/material/Container';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Link from '@mui/material/Link';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import CPIdata from './cached/CPIdata.json';
import AppealData from './cached/AppealData_20230205.json';
import { useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
//import BgVideo from './assets/bgvideo.mp4';

const startDates = [];
const amounts = [];
const lastYearInCPIdata = Math.max.apply(null, CPIdata.map(year => year.year));

const firstYearInAppealData = Math.min.apply(null, AppealData.map(appeal => (new Date(appeal.start_date)).getFullYear()));
const lastYearInAppealData = Math.max.apply(null, AppealData.map(appeal => (new Date(appeal.start_date)).getFullYear()));

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff0000',
      contrastText: '#fff',
    },
  },
});

const format = (number, decimals = 0) => {
  if (number) {
    let parts = parseFloat(number).toFixed(decimals).toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  } else return '0';
}

const formatAxisYTicks = (value) => {
  if (value >= 1000000000) return (value / 1000000000) + 'B';
  else if (value >= 1000000) return (value / 1000000) + 'M';
  else if (value >= 1000) return (value / 1000) + 'k';
  else return value;
}

const formatTooltip = (value, name, props) => {
  return [format(value) + ' CHF', name, props];
}

const adjustForInflation = (amount, baseYear, targetYear) => {
  baseYear = Number(baseYear);
  targetYear = Number(targetYear || lastYearInCPIdata);

  if (baseYear >= targetYear) return amount;
  else {
    const targetYearData = CPIdata.find(year => year.year === targetYear);
    const baseYearData = CPIdata.find(year => year.year === baseYear);
    const latestBaseIndex = Object.keys(baseYearData)
      .filter(key => key !== 'year')
      .reduce((a, b) => new Date(a) > new Date(b) ? a : b);
    return amount / baseYearData[latestBaseIndex] * targetYearData[latestBaseIndex];
  }
}

function App() {
  
  const [inflationAdjusted, setInflationAdjusted] = useState(false);
  const [chartData, setChartData] = useState([]);

  const processAppeals = data => {
    const filtered = data.sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    const tempChartData = Array.from({ length: lastYearInAppealData - firstYearInAppealData + 1 }, (v, k) => ({ year: firstYearInAppealData + k, amount: 0, appeals: [] }))

    console.log(filtered)
  
    for (let i = 0; i < filtered.length; i++) {
      const appeal = filtered[i];
      startDates.push(appeal.start_date.split('-')[0]);
      amounts.push(appeal.amount_requested);
  
      const year = new Date(appeal.start_date).getFullYear();
      const amount = parseInt(appeal.amount_funded) || parseInt(appeal.amount_requested);
  
      if (amount) { // only add it if there is funds data
        tempChartData.find(x => x.year === year).amount += inflationAdjusted ? adjustForInflation(amount, year) : amount;
        tempChartData.find(x => x.year === year).appeals.push(appeal)
      }
    }
    setChartData(tempChartData);
    //console.log(tempChartData);
  }

  useEffect(() => {
    processAppeals(AppealData);
    /*
    fetch('https://goadmin.ifrc.org/api/v2/appeal/?limit=10000')
      .then(response => response.json())
      .then(data => processAppeals(data.results));
    */
  }, [inflationAdjusted]);

  return (<>
    <CssBaseline />

    <ThemeProvider theme={theme}>
      <Container maxWidth={false} disableGutters sx={{background: "#eee"}}>
      <div id="bgvideo">
      {/* <video autoPlay loop muted style={{
            width: '100%', 
            objectFit: 'cover'
      }}><source src={BgVideo} type="video/mp4" /></video> */}
    </div>
        <Stack spacing={2} height="100vh" position="relative" zIndex="1">
          <Box textAlign="center" height="40vh" display="flex" flexDirection="column" justifyContent="center" color="#fff" gap="3%">
            <Typography variant="h1" sx={{fontFamily: 'Noto Serif', fontWeight: 700, fontSize: '3rem'}}>Humanitarian Finance History since 1919</Typography>
            <Typography variant="h2" sx={{fontFamily: 'Noto Serif', fontWeight: 400, fontSize: '1.5rem'}}>Based on the funding records of the International Federation of Red Cross and Red Crescent Societies (IFRC)*</Typography>
          </Box>
          <Box display="flex" justifyContent="center">
            <FormGroup>
              <FormControlLabel control={
                <Switch 
                  checked={ inflationAdjusted } 
                  onChange={() => setInflationAdjusted(!inflationAdjusted) }
                />
              } label="Adjust for inflation" />
            </FormGroup>
          </Box>
          <Box flexGrow={1} p="0 40px 0 20px">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="amount" stroke={theme.palette.primary.main} strokeWidth={3} />
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={formatAxisYTicks} />
                <Tooltip formatter={formatTooltip} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          <Box textAlign="center">
            <Typography variant="body2" sx={{fontFamily: 'Noto Serif', fontWeight: 400}}>* This website and this presentation are not affiliated with the IFRC</Typography>
            <List dense sx={{display: "flex", flexDirection: "row", justifyContent: 'center'}}>
              <ListItem sx={{width: 'auto', textAlign: 'center'}}><Typography variant="body2" sx={{fontFamily: 'Noto Serif', fontWeight: 400}}>Humanitarian appeal data from <Link href="https://goadmin.ifrc.org/docs/#api-v2-appeal-list">IFRC GO</Link></Typography></ListItem>
              <ListItem sx={{width: 'auto', textAlign: 'center'}}><Typography variant="body2" sx={{fontFamily: 'Noto Serif', fontWeight: 400}}>Inflation (CPI) data from the <Link href="https://www.bfs.admin.ch/asset/de/cc-d-05.02.08">Federal Statistical Office of Switzerland</Link></Typography></ListItem>
              <ListItem sx={{width: 'auto', textAlign: 'center'}}><Typography variant="body2" sx={{fontFamily: 'Noto Serif', fontWeight: 400}}>Code on <Link href="https://github.com/tmrk/humfin-history">GitHub</Link></Typography></ListItem>
            </List>
          </Box>
        </Stack>
        {/*
        <Stack p={5}>
          {
            AppealData.map((appeal, index) => 
              <Box fontFamily="Noto Sans Mono" key={index}>{
                (new Date(appeal.start_date)).toISOString().split('T')[0] + ' - ' +
                (new Date(appeal.end_date)).toISOString().split('T')[0] + ' | ' +
                appeal.country.name + ' | ' +
                'REQUESTED: ' + format(appeal.amount_requested) +
                ' | FUNDED: ' + format(appeal.amount_funded)
              }</Box>
            )
          }
        </Stack>
        */}
      </Container>
    </ThemeProvider>
  </>);
}

export default App;
