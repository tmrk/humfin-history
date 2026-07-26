import CssBaseline from '@mui/material/CssBaseline';
import './App.css';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Link from '@mui/material/Link';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, ReferenceLine, ReferenceArea } from 'recharts';
import { useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import BgVideo from './assets/bgvideo.mp4';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import References from './references.json';
import { APPEALS_API_URL, dedupeAppeals, aggregateByYear, adjustRowsForInflation } from './lib/appeals';
import { lastYearInCPIdata } from './lib/inflation';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff0000',
      light: '#ffaaaa',
      contrastText: '#fff',
    },
  },
});

const tableTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  typography: {
    fontFamily: [
      '"Noto Sans Mono"',
      'monospace'
    ].join(','),
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

const formatTooltip = (value, name) => [format(value) + ' CHF', name];

function App() {

  const [inflationAdjusted, setInflationAdjusted] = useState(false);
  const [showFunded, setShowFunded] = useState(true);
  const [showRequestedAsFundedPre1994, setShowRequestedAsFundedPre1994] = useState(true);
  const [showRequested, setShowRequested] = useState(false);
  const [displayReferences, setDisplayReferences] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [appeals, setAppeals] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(APPEALS_API_URL, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`IFRC GO API responded with HTTP ${response.status}`);
        return response.json();
      })
      .then(data => setAppeals(dedupeAppeals(data.results)))
      .catch(err => {
        if (err.name !== 'AbortError') setError(err);
      });
    return () => controller.abort();
  }, []);

  const yearlyTotals = useMemo(() => appeals ? aggregateByYear(appeals) : [], [appeals]);

  const chartData = useMemo(
    () => inflationAdjusted ? adjustRowsForInflation(yearlyTotals) : yearlyTotals,
    [yearlyTotals, inflationAdjusted]
  );

  return (<>
    <CssBaseline />
    <ThemeProvider theme={theme}>
      <Container maxWidth={false} disableGutters sx={{background: '#eee'}}>
      <div id="bgvideo">
      <video autoPlay playsInline loop muted style={{
            width: '100%',
            objectFit: 'cover'
      }}><source src={BgVideo} type="video/mp4" /></video>
    </div>
        <Stack spacing={2} height="100vh" position="relative" zIndex="1">
          <Box textAlign="center" height="25vh" display="flex" flexDirection="column" justifyContent="center" color="#fff" gap="3%">
            <Typography variant="h1" sx={{fontFamily: 'Noto Serif', fontWeight: 700, fontSize: '5.8vmin'}}>Humanitarian Finance History since 1919</Typography>
            <Typography variant="h2" sx={{fontFamily: 'Noto Serif', fontWeight: 400, fontSize: '3vmin'}}>Based on the funding records of the International Federation of Red Cross and Red Crescent Societies (IFRC)*</Typography>
          </Box>
          <Box display="flex" p="0 5%" justifyContent="center">
            <FormGroup sx={{display: "flex", flexDirection: "row"}}>
              <FormControlLabel control={
                <Switch
                  checked={ inflationAdjusted } disabled={!appeals}
                  onChange={() => setInflationAdjusted(!inflationAdjusted) }
                />
              } label={`Adjust for inflation (${lastYearInCPIdata} CHF)`} />
              <FormControlLabel control={
                <Switch
                  checked={ showFunded } disabled={!appeals}
                  onChange={() => setShowFunded(!showFunded) }
                />
              } label="Show funded" />
              <FormControlLabel control={
                <Switch
                  disabled={!showFunded || !appeals}
                  checked={ showRequestedAsFundedPre1994 }
                  onChange={() => setShowRequestedAsFundedPre1994(!showRequestedAsFundedPre1994) }
                />
              } label="Show requested as funded (pre-1994)" />
             <FormControlLabel control={
                <Switch
                  checked={ showRequested } disabled={!appeals}
                  onChange={() => setShowRequested(!showRequested) }
                />
              } label="Show requested" />
             <FormControlLabel control={
                <Switch
                  checked={ displayReferences } disabled={!appeals}
                  onChange={() => setDisplayReferences(!displayReferences) }
                />
              } label="Display references" />
             <FormControlLabel control={
                <Switch
                  checked={ showDataTable } disabled={!appeals}
                  onChange={() => setShowDataTable(!showDataTable) }
                />
              } label="Show data table below" />
            </FormGroup>
          </Box>
          <Box flexGrow={1} p="0 20px 0 10px">
            {chartData.length ?
            <ResponsiveContainer>
              <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={formatAxisYTicks} />
              {displayReferences ?
                References.map((reference, index) =>
                {
                  const props = { label: { value: reference.label, position: "top", offset: -30, y: 15,angle: 45, style: { fontSize: "0.7em" } } };
                  for (const key in reference) {
                    if (Object.hasOwnProperty.call(reference, key) && key !== "tag" && key !== "label") {
                      props[key] = reference[key];
                    }
                  }
                  let Reference;
                  switch (reference.tag) {
                    case "area":
                      Reference = <ReferenceArea key={index} {...props} />
                      break;
                    default:
                      Reference = <ReferenceLine key={index} {...props} />
                      break;
                  }
                  return Reference;
                })
              : null}
              <Tooltip formatter={formatTooltip} isAnimationActive={true} />
              <Legend />
                {showRequested
                  ? <Area type="monotone" dataKey="amountRequested" name="Requested" stackId="3" stroke={theme.palette.info.dark} strokeWidth={2} fill={theme.palette.info.light} />
                  : ''}
                {showFunded && showRequestedAsFundedPre1994
                  ? <Area type="monotone" dataKey="amountFundedAndRequestedPre1994" name="Funded (requested pre-1994)" stackId="1" stroke={theme.palette.primary.main} strokeWidth={2} fill={theme.palette.primary.light} fillOpacity="1" />
                  : showFunded
                  ? <Area type="monotone" dataKey="amountFunded" name="Funded" stackId="2" stroke={theme.palette.primary.main} strokeWidth={2} fill={theme.palette.primary.light} fillOpacity="1" />
                  : ''}
            </AreaChart>
            </ResponsiveContainer>
            : <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', height: '100%'}}>
                {error
                  ? <Typography><strong>Could not fetch appeal data from IFRC GO.</strong> Please try reloading the page. ({error.message})</Typography>
                  : <>
                      <CircularProgress />
                      <Typography><strong>Fetching appeal data from IFRC GO</strong></Typography>
                    </>}
              </Box>
            }
          </Box>
          <Box textAlign="center">
            <Typography variant="body2" sx={{fontFamily: 'Noto Serif', fontWeight: 400}}>* This website and this presentation are not affiliated with the IFRC</Typography>
            <List dense sx={{display: "flex", flexDirection: "row", justifyContent: 'center'}}>
              <ListItem sx={{width: 'auto', textAlign: 'center'}}><Typography variant="body2">Humanitarian appeal data from <Link href="https://goadmin.ifrc.org/docs/#api-v2-appeal-list">IFRC GO</Link></Typography></ListItem>
              <ListItem sx={{width: 'auto', textAlign: 'center'}}><Typography variant="body2">Inflation (CPI) data from the <Link href="https://www.bfs.admin.ch/asset/de/cc-d-05.02.08">Federal Statistical Office of Switzerland</Link></Typography></ListItem>
              <ListItem sx={{width: 'auto', textAlign: 'center'}}><Typography variant="body2">Code on <Link href="https://github.com/tmrk/humfin-history">GitHub</Link></Typography></ListItem>
            </List>
          </Box>
        </Stack>

        {showDataTable && appeals ?
          <ThemeProvider theme={tableTheme}>
          <TableContainer sx={{ overflowX: "initial", background: '#000' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Crisis</TableCell>
                  <TableCell align="right">Requested</TableCell>
                  <TableCell align="right">Funded</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appeals.map(appeal => (
                  <TableRow
                    key={appeal.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>{appeal.aid}</TableCell>
                    <TableCell>{appeal.code}</TableCell>
                    <TableCell>{(new Date(appeal.start_date)).toISOString().split('T')[0]}</TableCell>
                    <TableCell>{(new Date(appeal.end_date)).toISOString().split('T')[0]}</TableCell>
                    <TableCell>{appeal.country.name}</TableCell>
                    <TableCell>{appeal.atype_display}</TableCell>
                    <TableCell>{appeal.name}</TableCell>
                    <TableCell align="right">{format(appeal.amount_requested)}</TableCell>
                    <TableCell align="right">{format(appeal.amount_funded)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </ThemeProvider>
        : null}

      </Container>
    </ThemeProvider>
  </>
  );
}

export default App;
