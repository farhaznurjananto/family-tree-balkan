'use client';

import React, { Component } from 'react';
import FamilyTree from '@/app/view/viewTree';
import supabase from "@/libs/db";

export default class App extends Component {
    state = {
        nodes: [],
        loading: true,
        error: null
    };

    async componentDidMount() {
        try {
            const { data, error } = await supabase
                .from('trees')
                .select('file')
                .limit(1)
                .single();

            if (error) throw error;

            // console.log("fetching data: ", data)

            const fileContent = data?.file;

            // If fileContent is a stringified JSON, parse it
            const nodes = typeof fileContent === 'string'
                ? JSON.parse(fileContent)
                : fileContent;

            this.setState({ nodes, loading: false });
        } catch (err) {
            console.error('Error loading data:', err);
            this.setState({ error: err, loading: false });
        }
    }

    render() {
        const { nodes, loading, error } = this.state;

        if (loading) return <div>Loading...</div>;
        if (error) return <div>Error loading data</div>;

        return (
            <div style={{ height: '100vh', width: '100%' }}>
                <FamilyTree nodes={nodes} />
            </div>
        );
    }
}
