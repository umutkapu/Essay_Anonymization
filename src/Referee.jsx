import * as React from 'react';
import { extendTheme } from '@mui/material/styles';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import PersonSearch from '@mui/icons-material/PersonSearch';

const NAVIGATION = [
    { kind: 'header', title: 'Hakem İşlemleri' },
    { segment: 'referees', title: 'Hakemler', icon: <PersonSearch /> },
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

export default function RefereePanel(props) {
    const { window } = props;
    const router = useDemoRouter('/referees');
    const demoWindow = window ? window() : undefined;

    const [selectedReviewer, setSelectedReviewer] = React.useState(null);
    const [essayComments, setEssayComments] = React.useState({});

    // Örnek hakem ve makale verisi
    const reviewers = [
        { id: 'r1', name: "Prof. Dr. Ayşe Kaya" },
        { id: 'r2', name: "Doç. Dr. Ahmet Yıldız" },
        { id: 'r3', name: "Dr. Can Demir" },
    ];

    const assignedEssays = [
        { id: 1, title: "Makale 1", reviewerId: 'r1' },
        { id: 2, title: "Makale 2", reviewerId: 'r2' },
        { id: 3, title: "Makale 3", reviewerId: 'r1' },
        { id: 4, title: "Makale 4", reviewerId: 'r3' },
    ];

    const selectedReviewerEssays = assignedEssays.filter(
        (essay) => essay.reviewerId === selectedReviewer?.id
    );

    return (
        <AppProvider
            navigation={NAVIGATION}
            router={router}
            theme={demoTheme}
            window={demoWindow}
            branding={{
                title: 'Hakem',
                logo: (
                    <img
                        src="/referee.png"
                        alt="Hakem Sayfası"
                        onClick={() => router.navigate('/referee')}
                    />
                ),
            }}
        >
            <DashboardLayout>
                <PageContainer>
                    {router.pathname.endsWith('/referees') && (
                        <Grid container spacing={2} sx={{ p: 3 }}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="h6">Hakem Listesi</Typography>
                                <List component={Paper}>
                                    {reviewers.map((reviewer) => (
                                        <ListItem disablePadding key={reviewer.id}>
                                            <ListItemButton onClick={() => setSelectedReviewer(reviewer)}>
                                                <ListItemText primary={reviewer.name} />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>

                            <Grid item xs={12} md={8}>
                                {selectedReviewer ? (
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6">{selectedReviewer.name}</Typography>
                                            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                                                Yönlendirilmiş Makaleler:
                                            </Typography>

                                            {selectedReviewerEssays.length > 0 ? (
                                                selectedReviewerEssays.map((essay) => (
                                                    <Paper key={essay.id} sx={{ p: 2, mb: 2 }}>
                                                        <Typography variant="body1"><b>{essay.title}</b></Typography>

                                                        {/* Yorum girişi */}
                                                        <TextField
                                                            label="Yorumunuz"
                                                            variant="outlined"
                                                            fullWidth
                                                            multiline
                                                            rows={3}
                                                            value={essayComments[essay.id] || ""}
                                                            onChange={(e) =>
                                                                setEssayComments((prev) => ({
                                                                    ...prev,
                                                                    [essay.id]: e.target.value,
                                                                }))
                                                            }
                                                            sx={{ mt: 1 }}
                                                        />

                                                        {/* Kaydet butonu */}
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            sx={{ mt: 1 }}
                                                            onClick={() =>
                                                                alert(`Yorum kaydedildi:\n${essayComments[essay.id] || "(boş)"}`)
                                                            }
                                                        >
                                                            Yorumu Kaydet
                                                        </Button>
                                                    </Paper>
                                                ))
                                            ) : (
                                                <Typography variant="body2">
                                                    Bu hakeme yönlendirilmiş makale yok.
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Typography variant="body1" sx={{ mt: 2 }}>
                                        Bir hakem seçiniz...
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>
                    )}
                </PageContainer>
            </DashboardLayout>
        </AppProvider>
    );
}
