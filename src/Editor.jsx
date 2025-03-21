import * as React from 'react';
import { extendTheme } from '@mui/material/styles';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ArticleIcon from '@mui/icons-material/Article';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoFixHigh from '@mui/icons-material/AutoFixHigh';

const NAVIGATION = [
    { kind: 'header', title: 'Editor' },
    { segment: 'essays', title: 'Makaleler', icon: <ArticleIcon /> },
    { segment: 'orientation', title: 'Makale Yönlendirme', icon: <ArrowForwardIcon /> },
    { segment: 'anonymization', title: 'Anonimleştirme', icon: <AutoFixHigh /> },
];

const demoTheme = extendTheme({
    colorSchemes: { light: true, dark: true },
    colorSchemeSelector: 'class',
    breakpoints: { values: { xs: 0, sm: 600, md: 600, lg: 1200, xl: 1536 } },
});

function useDemoRouter(initialPath) {
    const [pathname, setPathname] = React.useState(initialPath);
    return React.useMemo(() => ({
        pathname,
        searchParams: new URLSearchParams(),
        navigate: (path) => setPathname(String(path)),
    }), [pathname]);
}

export default function EssayInquery(props) {
    const { window } = props;
    const router = useDemoRouter('/essays');
    const demoWindow = window ? window() : undefined;

    // Makale ve hakem verileri
    const [essays, setEssays] = React.useState([]);
    const [reviewers, setReviewers] = React.useState([]);
    const [selectedReviewers, setSelectedReviewers] = React.useState({});

    // API veya mock veri çekme
    React.useEffect(() => {
        // Örnek makale verisi
        const mockEssays = [
            { id: 1, title: "Makale 1", author: "Umut Kapukıran", date: "2024-03-13", status: "Anonimleştirilmemiş" },
            { id: 2, title: "Makale 2", author: "Zeynep Demir", date: "2024-03-12", status: "Yayında" },
            { id: 3, title: "Makale 3", author: "Mehmet Çelik", date: "2024-03-11", status: "Anonimleştirilmiş" },
        ];

        // Örnek hakem listesi
        const mockReviewers = [
            { id: 'r1', name: "Prof. Dr. Ayşe Kaya" },
            { id: 'r2', name: "Doç. Dr. Ahmet Yıldız" },
            { id: 'r3', name: "Dr. Can Demir" },
            { id: 'r4', name: "Mal. Dr. Eren Oğuz" },
        ];

        setEssays(mockEssays);
        setReviewers(mockReviewers);
    }, []);

    return (
        <AppProvider
            navigation={NAVIGATION}
            router={router}
            theme={demoTheme}
            window={demoWindow}
            branding={{
                title: 'Editör',
                logo: <img src="/editor.png" alt="Editor" onClick={() => router.navigate('/editor')} />,
            }}
        >
            <DashboardLayout>
                <PageContainer>

                    {/* 📌 Makale Listesi Segmenti */}
                    {router.pathname.endsWith('/essays') && (
                        <Grid container spacing={2} sx={{ p: 3 }}>
                            <Grid item xs={12}>
                                <h2>Makaleler</h2>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><b>ID</b></TableCell>
                                                <TableCell><b>Başlık</b></TableCell>
                                                <TableCell><b>Yazar</b></TableCell>
                                                <TableCell><b>Tarih</b></TableCell>
                                                <TableCell><b>Durumu</b></TableCell>
                                                <TableCell><b>İşlem</b></TableCell>
                                                <TableCell><b>İndir</b></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {essays.map((essay) => (
                                                <TableRow key={essay.id}>
                                                    <TableCell>{essay.id}</TableCell>
                                                    <TableCell>{essay.title}</TableCell>
                                                    <TableCell>{essay.author}</TableCell>
                                                    <TableCell>{essay.date}</TableCell>
                                                    <TableCell>{essay.status}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            onClick={() => alert(`Makale Görüntülendi: ${essay.title}`)}
                                                        >
                                                            Görüntüle
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            startIcon={<DownloadIcon />}
                                                            onClick={() => alert(`Makale İndirildi: ${essay.title}`)}
                                                        >
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    )}

                    {/* 📌 Makale Yönlendirme Segmenti */}
                    {router.pathname.endsWith('/orientation') && (
                        <Grid container spacing={2} sx={{ p: 3 }}>
                            <Grid item xs={12}>
                                <h2>Makale Yönlendirme</h2>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><b>ID</b></TableCell>
                                                <TableCell><b>Başlık</b></TableCell>
                                                <TableCell><b>Yazar</b></TableCell>
                                                <TableCell><b>Tarih</b></TableCell>
                                                <TableCell><b>Durumu</b></TableCell>
                                                <TableCell><b>Hakem Seç</b></TableCell>
                                                <TableCell><b>Yönlendir</b></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {essays
                                                .filter((essay) => essay.status === "Anonimleştirilmiş")
                                                .map((essay) => (
                                                    <TableRow key={essay.id}>
                                                        <TableCell>{essay.id}</TableCell>
                                                        <TableCell>{essay.title}</TableCell>
                                                        <TableCell>{essay.author}</TableCell>
                                                        <TableCell>{essay.date}</TableCell>
                                                        <TableCell>{essay.status}</TableCell>
                                                        <TableCell>
                                                            <Select
                                                                value={selectedReviewers[essay.id] || ""}
                                                                onChange={(e) => setSelectedReviewers((prev) => ({
                                                                    ...prev, [essay.id]: e.target.value
                                                                }))}
                                                                displayEmpty
                                                                fullWidth
                                                            >
                                                                <MenuItem value="" disabled>Hakem Seç</MenuItem>
                                                                {reviewers.map((reviewer) => (
                                                                    <MenuItem key={reviewer.id} value={reviewer.name}>
                                                                        {reviewer.name}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                onClick={() => alert(`Makale "${essay.title}" hakeme yönlendirildi: ${selectedReviewers[essay.id] || "Seçilmedi"}`)}
                                                            >
                                                                Gönder
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    )}

                    {router.pathname.endsWith('/anonymization') && (
                        <Grid container spacing={2} sx={{ p: 3 }}>
                            <Grid item xs={12}>
                                <h2>Anonimleştirme</h2>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><b>ID</b></TableCell>
                                                <TableCell><b>Başlık</b></TableCell>
                                                <TableCell><b>Yazar</b></TableCell>
                                                <TableCell><b>Tarih</b></TableCell>
                                                <TableCell><b>Durumu</b></TableCell>
                                                <TableCell><b>İşlem</b></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {essays
                                                .filter((essay) => essay.status === "Anonimleştirilmemiş")
                                                .map((essay) => (
                                                    <TableRow key={essay.id}>
                                                        <TableCell>{essay.id}</TableCell>
                                                        <TableCell>{essay.title}</TableCell>
                                                        <TableCell>{essay.author}</TableCell>
                                                        <TableCell>{essay.date}</TableCell>
                                                        <TableCell>{essay.status}</TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="contained"
                                                                color="secondary"
                                                                onClick={() => {
                                                                    setEssays(prevEssays =>
                                                                        prevEssays.map(e =>
                                                                            e.id === essay.id
                                                                                ? { ...e, status: "Anonimleştirilmiş" }
                                                                                : e
                                                                        )
                                                                    );
                                                                    alert(`Makale "${essay.title}" anonimleştirildi.`);
                                                                }}
                                                            >
                                                                Anonimleştir
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    )}


                </PageContainer>
            </DashboardLayout>
        </AppProvider>
    );
}
