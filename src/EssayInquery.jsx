import * as React from 'react';
import { extendTheme, styled } from '@mui/material/styles';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';

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

    const handleSearch = () => {
        console.log("Sorgulama yapılıyor...");
        console.log("E-posta:", email);
        console.log("Takip Numarası:", trackingNumber);
        alert(`Sorgulama yapıldı! \nE-posta: ${email} \nTakip No: ${trackingNumber}`);
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

                            {/* Makale Takip Numarası Girişi */}
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
                        </Grid>
                    )}
                </PageContainer>
            </DashboardLayout>
        </AppProvider>
    );
}
