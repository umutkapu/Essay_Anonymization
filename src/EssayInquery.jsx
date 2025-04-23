import * as React from 'react';
import { extendTheme } from '@mui/material/styles';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import { Divider } from '@mui/material';

const NAVIGATION = [
    { kind: 'header', title: 'Makale Sorgulama' },
    { segment: 'essay_inquery', title: 'Makale Sorgulama', icon: <SearchIcon /> },
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
    const router = useDemoRouter('/essay_inquery');
    const demoWindow = window ? window() : undefined;

    const [email, setEmail] = React.useState('');
    const [trackingNumber, setTrackingNumber] = React.useState('');
    const [result, setResult] = React.useState(null);
    const [error, setError] = React.useState('');

    const handleSearch = async () => {
        setError('');
        setResult(null);

        try {
            const response = await fetch(`http://localhost:8000/sorgula/?email=${email}&tracking=${trackingNumber}`);
            const data = await response.json();

            if (response.ok) {
                setResult(data);
            } else {
                setError(data.error || "Bilinmeyen bir hata oluştu.");
            }
        } catch (err) {
            console.error("Hata:", err);
            setError("Sunucuya bağlanılamadı.");
        }
    };

    return (
        <AppProvider
            navigation={NAVIGATION}
            router={router}
            theme={demoTheme}
            window={demoWindow}
            branding={{
                title: 'Makale Sorgulama',
                logo: <img src="/sorgu.png" alt="Makale Sorgulama" onClick={() => router.navigate('/essay_inquery')} />,
            }}
        >
            <DashboardLayout>
                <PageContainer>
                    {router.pathname.endsWith('/essay_inquery') && (
                        <Grid container spacing={2} sx={{ p: 3 }}>
                            {/* E-posta Girişi */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="E-posta Adresiniz"
                                    variant="outlined"
                                    placeholder="E-posta adresinizi girin..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </Grid>

                            {/* Takip No */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Makale Takip Numarası"
                                    variant="outlined"
                                    placeholder="Takip numarasını girin..."
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                />
                            </Grid>

                            {/* Sorgula Butonu */}
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SearchIcon />}
                                    fullWidth
                                    onClick={handleSearch}
                                >
                                    Sorgula
                                </Button>
                            </Grid>

                            {/* Sonuç */}
                            {result && (
                                <>
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 4 }} />
                                        <h3>📄 Makale Bilgileri</h3>
                                        <p><b>Başlık:</b> {result.title}</p>
                                        <p><b>Durum:</b> {result.status}</p>
                                        <p><b>Yüklenme Tarihi:</b> {result.upload_date}</p>
                                        <p><b>Konu:</b> {result.konu}</p>
                                        <p><b>PDF:</b> <a href={`http://localhost:8000/media/uploads/${result.title}`} target="_blank" rel="noreferrer">İndir</a></p>
                                    </Grid>

                                    {/* Hakem Değerlendirmesi */}
                                    {result.review && (
                                        <Grid item xs={12}>
                                            <Divider sx={{ my: 4 }} />
                                            <h3>📝 Hakem Değerlendirmesi</h3>
                                            <p><b>Hakem:</b> {result.review.reviewer_name}</p>
                                            <p><b>Yorum:</b> {result.review.comment}</p>
                                            <p><b>Sonuç:</b> {result.review.result}</p>
                                            <p><b>Tarih:</b> {result.review.timestamp}</p>
                                        </Grid>
                                    )}
                                </>
                            )}

                            {/* Hata */}
                            {error && (
                                <Grid item xs={12}>
                                    <p style={{ color: "red" }}><b>Hata:</b> {error}</p>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </PageContainer>
            </DashboardLayout>
        </AppProvider>
    );
}
